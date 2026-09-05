import sys
import os
import random
import matplotlib.pyplot as plt
import seaborn as sns

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from process_module import Process, clone_process_list
from scheduling import run_fcfs, RRScheduler, AdaptiveRRScheduler

def generate_random_workload(num_processes, max_burst):
    processes = []
    # Arrival times spread out
    for i in range(num_processes):
        pid = f"P{i+1}"
        arrival = random.randint(0, num_processes * 2)
        burst = random.randint(1, max_burst)
        processes.append(Process(pid, arrival, burst))
    return processes

def extract_metrics(processes):
    if not processes:
        return (0, 0, 0, 0)
    n = len(processes)
    wt = sum(p.waiting_time for p in processes) / n
    tt = sum(p.turnaround_time for p in processes) / n
    rt = sum(p.response_time for p in processes) / n
    cs = sum(p.context_switches for p in processes)
    return wt, tt, rt, cs

def run_simulation(num_runs=50):
    fcfs_metrics = {"wt": [], "tt": [], "rt": [], "cs": []}
    rr2_metrics = {"wt": [], "tt": [], "rt": [], "cs": []}
    rr4_metrics = {"wt": [], "tt": [], "rt": [], "cs": []}
    arr_metrics = {"wt": [], "tt": [], "rt": [], "cs": []}

    for _ in range(num_runs):
        workload = generate_random_workload(num_processes=10, max_burst=15)
        
        # FCFS
        procs = clone_process_list(workload)
        run_fcfs(procs)
        wt, tt, rt, cs = extract_metrics(procs)
        fcfs_metrics["wt"].append(wt); fcfs_metrics["tt"].append(tt)
        fcfs_metrics["rt"].append(rt); fcfs_metrics["cs"].append(cs)
        
        # RR2
        procs = clone_process_list(workload)
        RRScheduler(procs, 2).run()
        wt, tt, rt, cs = extract_metrics(procs)
        rr2_metrics["wt"].append(wt); rr2_metrics["tt"].append(tt)
        rr2_metrics["rt"].append(rt); rr2_metrics["cs"].append(cs)
        
        # RR4
        procs = clone_process_list(workload)
        RRScheduler(procs, 4).run()
        wt, tt, rt, cs = extract_metrics(procs)
        rr4_metrics["wt"].append(wt); rr4_metrics["tt"].append(tt)
        rr4_metrics["rt"].append(rt); rr4_metrics["cs"].append(cs)
        
        # ARR
        procs = clone_process_list(workload)
        AdaptiveRRScheduler(procs).run()
        wt, tt, rt, cs = extract_metrics(procs)
        arr_metrics["wt"].append(wt); arr_metrics["tt"].append(tt)
        arr_metrics["rt"].append(rt); arr_metrics["cs"].append(cs)
        
    return fcfs_metrics, rr2_metrics, rr4_metrics, arr_metrics

def main():
    print("Generating research data... running simulations.")
    fcfs, rr2, rr4, arr = run_simulation(50)
    
    os.makedirs("research", exist_ok=True)
    sns.set_theme(style="whitegrid")
    
    # 1. Bar Chart: Average Context Switches
    plt.figure(figsize=(8, 6))
    labels = ['FCFS', 'RR (Q=2)', 'RR (Q=4)', 'Adaptive RR']
    means = [
        sum(fcfs['cs'])/50, 
        sum(rr2['cs'])/50, 
        sum(rr4['cs'])/50, 
        sum(arr['cs'])/50
    ]
    sns.barplot(x=labels, y=means, palette="viridis")
    plt.title("Average Total Context Switches (10 Processes)")
    plt.ylabel("Context Switches")
    plt.savefig("research/context_switches.png")
    plt.close()
    
    # 2. Bar Chart: Average Response Time
    plt.figure(figsize=(8, 6))
    means_rt = [
        sum(fcfs['rt'])/50, 
        sum(rr2['rt'])/50, 
        sum(rr4['rt'])/50, 
        sum(arr['rt'])/50
    ]
    sns.barplot(x=labels, y=means_rt, palette="magma")
    plt.title("Average Response Time")
    plt.ylabel("Time Units")
    plt.savefig("research/response_time.png")
    plt.close()

    # 3. Bar Chart: Average Turnaround Time
    plt.figure(figsize=(8, 6))
    means_tt = [
        sum(fcfs['tt'])/50, 
        sum(rr2['tt'])/50, 
        sum(rr4['tt'])/50, 
        sum(arr['tt'])/50
    ]
    sns.barplot(x=labels, y=means_tt, palette="crest")
    plt.title("Average Turnaround Time")
    plt.ylabel("Time Units")
    plt.savefig("research/turnaround_time.png")
    plt.close()

    print("Graphs successfully generated in research/ directory!")

if __name__ == "__main__":
    main()
