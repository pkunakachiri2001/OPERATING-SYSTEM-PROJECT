from process_module import ReadyQueue

def run_priority(processes):
    """
    Executes the Non-Preemptive Priority scheduling algorithm.
    Selects the process with the lowest priority value (lower = higher priority).
    """
    # Sort initially by arrival time, then by priority
    sorted_processes = sorted(processes, key=lambda p: (p.arrival_time, p.priority))
    
    ready_queue = ReadyQueue()
    current_time = 0
    completed = 0
    n = len(processes)
    gantt_chart = []
    
    idx = 0
    
    while completed < n:
        # Add processes that have arrived up to current_time
        while idx < n and sorted_processes[idx].arrival_time <= current_time:
            ready_queue.add(sorted_processes[idx])
            idx += 1
            
        if ready_queue.is_empty():
            # CPU is idle, advance time
            current_time = sorted_processes[idx].arrival_time
            continue
            
        # Select process with highest priority (lowest priority number)
        best_process = min(ready_queue.queue, key=lambda p: (p.priority, p.arrival_time))
        ready_queue.queue.remove(best_process)
        
        current_process = best_process
        
        # Dispatch
        current_process.mark_dispatched(current_time)
        start_time = current_time
        
        # Execute for full burst time (non-preemptive)
        current_time += current_process.burst_time
        current_process.remaining_time = 0
        
        # Complete
        current_process.mark_completed(current_time)
        completed += 1
        
        gantt_chart.append({
            "pid": current_process.pid,
            "start": start_time,
            "end": current_time
        })
        
    return gantt_chart
