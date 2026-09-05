"""
Round Robin (RR) Scheduling Algorithm
"""
from process_module import ReadyQueue

class RRScheduler:
    """
    Object-oriented Round Robin Scheduler.
    Designed so that Adaptive RR can inherit this class and override `get_quantum()`.
    """
    
    def __init__(self, processes, time_quantum):
        self.processes = sorted(processes, key=lambda p: (p.arrival_time, p.pid))
        self.time_quantum = time_quantum
        self.ready_queue = ReadyQueue()
        self.gantt_chart = []
        self.current_time = 0
        
    def get_quantum(self, process=None):
        """
        Returns the time quantum. 
        Standard RR uses a fixed quantum. Adaptive RR will override this!
        """
        return self.time_quantum
        
    def _post_execution_hook(self, process, execute_time):
        """
        Hook for subclasses to execute logic after a CPU burst (e.g., updating EWMA).
        """
        pass
        
    def run(self):
        """
        Executes the main scheduling loop.
        Returns the Gantt chart.
        """
        unarrived_processes = list(self.processes) # Create a copy to track who hasn't arrived
        
        while unarrived_processes or not self.ready_queue.is_empty():
            # 1. Add all newly arrived processes to the ready queue
            while unarrived_processes and unarrived_processes[0].arrival_time <= self.current_time:
                arrived_process = unarrived_processes.pop(0)
                self.ready_queue.add(arrived_process)
                
            # 2. If ready queue is empty, fast-forward time to next arrival
            if self.ready_queue.is_empty():
                if unarrived_processes:
                    # CPU is idle
                    self.current_time = unarrived_processes[0].arrival_time
                    continue
                else:
                    break
                    
            # 3. Pop the next process
            current_process = self.ready_queue.pop()
            
            # 4. Dispatch the process
            start_time = self.current_time
            current_process.mark_dispatched(self.current_time)
            
            # 5. Get quantum and execute
            q = self.get_quantum(current_process)
            execute_time = min(q, current_process.remaining_time)
            
            self.current_time += execute_time
            current_process.remaining_time -= execute_time
            
            # 6. Record execution in Gantt Chart
            self.gantt_chart.append((current_process.pid, start_time, self.current_time))
            
            # 6b. Call hook for subclasses (e.g. Adaptive RR updating history)
            self._post_execution_hook(current_process, execute_time)
            
            # 7. Check for new arrivals DURING this execution burst
            # We must add them to the ready queue BEFORE placing the preempted process back
            while unarrived_processes and unarrived_processes[0].arrival_time <= self.current_time:
                arrived_process = unarrived_processes.pop(0)
                self.ready_queue.add(arrived_process)
                
            # 8. Check if process is finished or preempted
            if current_process.remaining_time == 0:
                current_process.mark_completed(self.current_time)
            else:
                current_process.mark_preempted()
                self.ready_queue.add(current_process)
                
        return self.gantt_chart
