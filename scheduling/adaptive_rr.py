"""
Adaptive Round Robin (ARR) Scheduling Algorithm
"""
from .rr import RRScheduler

class AdaptiveRRScheduler(RRScheduler):
    """
    Object-oriented Adaptive Round Robin Scheduler.
    Inherits from RRScheduler to reuse the execution loop.
    Replaces the fixed quantum with a dynamic EWMA and queue pressure based calculation.
    """
    
    def __init__(self, processes, alpha=0.5, beta=0.2, q_min=2, q_max=10):
        # Pass time_quantum=None to the base class, we won't use it.
        super().__init__(processes, time_quantum=None)
        
        self.alpha = alpha
        self.beta = beta
        self.q_min = q_min
        self.q_max = q_max
        
        # Recent Workload Average (RWA)
        # Initialize to 0. It will immediately adapt upon the first burst.
        self.rwa = 0
        
    def _post_execution_hook(self, process, execute_time):
        """
        Hook called by the base class after every execution burst.
        Updates the Exponentially Weighted Moving Average (EWMA) of the workload.
        """
        # If this is the very first burst, just set RWA to the burst length
        if self.rwa == 0:
            self.rwa = execute_time
        else:
            self.rwa = self.alpha * execute_time + (1 - self.alpha) * self.rwa
            
    def get_quantum(self, current_process=None):
        """
        Dynamically calculates the time quantum.
        Formula:
        RQA = avg(remaining time of queue)
        RWA = EWMA of recent bursts
        Q_base = 0.7*RQA + 0.3*RWA
        Q = Q_base / (1 + beta*(n-1))
        Q = clamp(Q, q_min, q_max)
        """
        n = self.ready_queue.size()
        
        # 1. No Contention
        if n == 0:
            return current_process.remaining_time if current_process else self.q_max
            
        # 2. Contention (Queue > 0)
        # Calculate Ready Queue Average (RQA)
        total_waiting_time = sum(p.remaining_time for p in self.ready_queue.queue)
        rqa = total_waiting_time / n
        
        # Base Quantum
        q_base = (0.7 * rqa) + (0.3 * self.rwa)
        
        # Queue Pressure Scaling
        q = q_base / (1 + self.beta * (n - 1))
        
        # Clamp between Q_min and Q_max
        q = max(self.q_min, min(self.q_max, int(q)))
        
        return q
