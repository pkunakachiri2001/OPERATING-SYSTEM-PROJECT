"""
First-Come-First-Serve (FCFS) Scheduling Algorithm
"""

def run_fcfs(processes):
    """
    Runs the FCFS scheduling algorithm on a list of processes.
    Assumes all processes in the list have unique PIDs.
    Returns the Gantt chart as a list of (pid, start_time, end_time) tuples.
    """
    # Sort processes primarily by arrival time, then by PID just for stability
    sorted_processes = sorted(processes, key=lambda p: (p.arrival_time, p.pid))
    
    current_time = 0
    gantt_chart = []
    
    for p in sorted_processes:
        # If the CPU is idle waiting for the next process to arrive
        if current_time < p.arrival_time:
            current_time = p.arrival_time
            
        start_time = current_time
        p.mark_dispatched(current_time)
        
        # Execute to completion
        current_time += p.remaining_time
        p.remaining_time = 0
        
        p.mark_completed(current_time)
        
        gantt_chart.append((p.pid, start_time, current_time))
        
    return gantt_chart
