"""
Result generation utilities (Gantt Chart & Metrics)
"""

def print_gantt_chart(gantt_chart):
    """
    Prints a textual representation of the Gantt chart.
    gantt_chart: list of (pid, start_time, end_time)
    """
    if not gantt_chart:
        print("Gantt Chart is empty.")
        return

    print("\n--- Gantt Chart ---")
    
    # Print the blocks
    bars = []
    for pid, start, end in gantt_chart:
        # Simple scaling: roughly 1 dash per time unit, minimum 3
        duration = end - start
        bars.append(f"| {pid} ({duration}) ")
    print("".join(bars) + "|")
    
    # Print the timeline
    times = [str(gantt_chart[0][1])]
    for _, _, end in gantt_chart:
        times.append(str(end))
        
    timeline = ""
    for i in range(len(bars)):
        bar_len = len(bars[i])
        timeline += times[i].ljust(bar_len)
    timeline += times[-1]
    
    print(timeline)


def print_metrics(processes):
    """
    Calculates and prints the average metrics for a completed process list.
    """
    if not processes:
        return
        
    n = len(processes)
    total_waiting = sum(p.waiting_time for p in processes)
    total_turnaround = sum(p.turnaround_time for p in processes)
    total_response = sum(p.response_time for p in processes)
    total_context_switches = sum(p.context_switches for p in processes)
    
    print("\n--- Scheduling Metrics ---")
    print(f"Average Waiting Time:    {total_waiting / n:.2f}")
    print(f"Average Turnaround Time: {total_turnaround / n:.2f}")
    print(f"Average Response Time:   {total_response / n:.2f}")
    print(f"Total Context Switches:  {total_context_switches}")
    
    print("\n--- Process Details ---")
    print(f"{'PID':<5} | {'Arrival':<8} | {'Burst':<6} | {'Finish':<7} | {'Wait':<5} | {'Turnaround':<11} | {'Response':<9} | {'Switches':<8}")
    print("-" * 75)
    for p in processes:
        print(f"{p.pid:<5} | {p.arrival_time:<8} | {p.burst_time:<6} | {p.completion_time:<7} | {p.waiting_time:<5} | {p.turnaround_time:<11} | {p.response_time:<9} | {p.context_switches:<8}")
