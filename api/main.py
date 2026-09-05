import sys
import os
from typing import List, Optional, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from process_module import Process, clone_process_list
from scheduling import run_fcfs, RRScheduler, AdaptiveRRScheduler, run_sjf, run_priority

app = FastAPI(title="OS Scheduling API")

# Allow CORS for local frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessInput(BaseModel):
    pid: str
    arrival_time: int
    burst_time: int
    priority: int = 1

class SimulationRequest(BaseModel):
    processes: List[ProcessInput]
    alpha: float = 0.5
    beta: float = 0.2
    q_min: int = 2
    q_max: int = 10
    rr_quantum: int = 4

def pydantic_to_process(p_inputs: List[ProcessInput]) -> List[Process]:
    return [Process(p.pid, p.arrival_time, p.burst_time, p.priority) for p in p_inputs]

def extract_metrics(processes: List[Process]) -> dict:
    if not processes:
        return {}
    
    n = len(processes)
    return {
        "avg_waiting_time": sum(p.waiting_time for p in processes) / n,
        "avg_turnaround_time": sum(p.turnaround_time for p in processes) / n,
        "avg_response_time": sum(p.response_time for p in processes) / n,
        "total_context_switches": sum(p.context_switches for p in processes),
        "process_details": [p.to_dict() for p in processes]
    }

@app.post("/simulate")
def simulate(req: SimulationRequest):
    base_processes = pydantic_to_process(req.processes)
    
    # Run FCFS
    fcfs_procs = clone_process_list(base_processes)
    fcfs_gantt = run_fcfs(fcfs_procs)
    fcfs_metrics = extract_metrics(fcfs_procs)
    
    # Run SJF
    sjf_procs = clone_process_list(base_processes)
    sjf_gantt = run_sjf(sjf_procs)
    sjf_metrics = extract_metrics(sjf_procs)
    
    # Run Priority
    prio_procs = clone_process_list(base_processes)
    prio_gantt = run_priority(prio_procs)
    prio_metrics = extract_metrics(prio_procs)
    
    # Run Standard RR
    rr_procs = clone_process_list(base_processes)
    rr_sched = RRScheduler(rr_procs, time_quantum=req.rr_quantum)
    rr_gantt = rr_sched.run()
    rr_metrics = extract_metrics(rr_procs)
    
    # Run Adaptive RR
    arr_procs = clone_process_list(base_processes)
    arr_sched = AdaptiveRRScheduler(arr_procs, alpha=req.alpha, beta=req.beta, q_min=req.q_min, q_max=req.q_max)
    arr_gantt = arr_sched.run()
    arr_metrics = extract_metrics(arr_procs)
    
    return {
        "fcfs": {"gantt": fcfs_gantt, "metrics": fcfs_metrics, "processes": [p.to_dict() for p in fcfs_procs]},
        "sjf": {"gantt": sjf_gantt, "metrics": sjf_metrics, "processes": [p.to_dict() for p in sjf_procs]},
        "priority": {"gantt": prio_gantt, "metrics": prio_metrics, "processes": [p.to_dict() for p in prio_procs]},
        "rr": {"gantt": rr_gantt, "metrics": rr_metrics, "processes": [p.to_dict() for p in rr_procs]},
        "adaptive_rr": {"gantt": arr_gantt, "metrics": arr_metrics, "processes": [p.to_dict() for p in arr_procs]},
    }
