import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from process_module import get_sample_processes, clone_process_list
from scheduling import run_fcfs, RRScheduler, AdaptiveRRScheduler, run_sjf, run_priority, print_gantt_chart, print_metrics

def main():
    print("=== Testing Scheduling Algorithms ===")
    
    # Base workload to clone from
    base_workload = get_sample_processes()
    
    # 1. Test FCFS
    print("\n\n--- 1. Testing First-Come-First-Serve (FCFS) ---")
    fcfs_processes = clone_process_list(base_workload)
    gantt_fcfs = run_fcfs(fcfs_processes)
    print_gantt_chart(gantt_fcfs)
    print_metrics(fcfs_processes)
    
    # 2. Test Standard Round Robin (Q=2)
    print("\n\n--- 2. Testing Round Robin (Quantum = 2) ---")
    rr_processes_q2 = clone_process_list(base_workload)
    scheduler_q2 = RRScheduler(rr_processes_q2, time_quantum=2)
    gantt_rr_q2 = scheduler_q2.run()
    print_gantt_chart(gantt_rr_q2)
    print_metrics(rr_processes_q2)

    # 3. Test Standard Round Robin (Q=4)
    print("\n\n--- 3. Testing Round Robin (Quantum = 4) ---")
    rr_processes_q4 = clone_process_list(base_workload)
    scheduler_q4 = RRScheduler(rr_processes_q4, time_quantum=4)
    gantt_rr_q4 = scheduler_q4.run()
    print_gantt_chart(gantt_rr_q4)
    print_metrics(rr_processes_q4)

    # 4. Test Adaptive Round Robin
    print("\n\n--- 4. Testing Adaptive Round Robin (ARR) ---")
    arr_processes = clone_process_list(base_workload)
    # Using defaults: alpha=0.5, beta=0.2, q_min=2, q_max=10
    scheduler_arr = AdaptiveRRScheduler(arr_processes)
    gantt_arr = scheduler_arr.run()
    print_gantt_chart(gantt_arr)
    print_metrics(arr_processes)

    # 5. Test Shortest Job First
    print("\n\n--- 5. Testing Shortest Job First (SJF) ---")
    sjf_processes = clone_process_list(base_workload)
    gantt_sjf = run_sjf(sjf_processes)
    print_gantt_chart(gantt_sjf)
    print_metrics(sjf_processes)

    # 6. Test Priority Scheduling
    print("\n\n--- 6. Testing Priority Scheduling ---")
    # Set priorities explicitly
    prio_processes = clone_process_list(base_workload)
    prio_processes[0].priority = 4
    prio_processes[1].priority = 1
    prio_processes[2].priority = 2
    prio_processes[3].priority = 3
    
    gantt_prio = run_priority(prio_processes)
    print_gantt_chart(gantt_prio)
    print_metrics(prio_processes)

if __name__ == "__main__":
    main()
