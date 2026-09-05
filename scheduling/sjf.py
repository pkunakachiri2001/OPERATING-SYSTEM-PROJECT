from process_module import ReadyQueue

def run_sjf(processes):
    """
    Executes the Non-Preemptive Shortest Job First (SJF) scheduling algorithm.
    SJF selects the process with the smallest burst time from the ready queue.
    """
    # Sort initially by arrival time, then by burst time to break ties early
    sorted_processes = sorted(processes, key=lambda p: (p.arrival_time, p.burst_time))
    
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
            
        # Select process with shortest burst time
        # ready_queue.queue is a deque, we can sort it or find min
        shortest_process = min(ready_queue.queue, key=lambda p: (p.burst_time, p.arrival_time))
        ready_queue.queue.remove(shortest_process)
        
        current_process = shortest_process
        
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
