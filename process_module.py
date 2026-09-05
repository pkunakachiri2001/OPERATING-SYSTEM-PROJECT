"""
Process & Input Module
Author: Nooryen
Handles: Process structure, input mechanism, ready-queue framework
"""

from collections import deque


class Process:
    """Represents a single process in the scheduling simulation."""

    def __init__(self, pid, arrival_time, burst_time, priority=1):
        if arrival_time < 0 or burst_time <= 0:
            raise ValueError(f"Invalid process data for {pid}: "
                              f"arrival_time must be >= 0, burst_time must be > 0")

        self.pid = pid
        self.arrival_time = arrival_time
        self.burst_time = burst_time          # original CPU burst time (never modify this)
        self.remaining_time = burst_time      # used/decremented during RR / Adaptive RR
        self.priority = priority              # Used for Priority Scheduling

        # Metrics filled in by whichever algorithm runs this process
        self.completion_time = 0
        self.waiting_time = 0
        self.turnaround_time = 0
        self.response_time = -1               # -1 = process hasn't started yet
        self.first_run = True                 # flips to False after first CPU burst
        self.context_switches = 0             # incremented ONLY via mark_preempted()

    def mark_dispatched(self, current_time):
        """
        Call this when the process is given the CPU (start of a burst/quantum).
        Handles response_time and first_run automatically — do NOT set these manually.
        This does NOT count as a context switch.
        """
        if self.first_run:
            self.response_time = current_time - self.arrival_time
            self.first_run = False

    def mark_preempted(self):
        """
        Call this ONLY when a process's time quantum expires and it is placed
        back into the ready queue (still has remaining_time > 0).
        Do NOT call this on a process's first dispatch, and do NOT call this
        when a process finishes (use mark_completed() instead).
        This is the single source of truth for context_switches so Ray and
        Panashe's algorithms stay consistent with each other.
        """
        self.context_switches += 1

    def mark_completed(self, current_time):
        """Call this when the process finishes execution (remaining_time == 0)."""
        self.completion_time = current_time
        self.turnaround_time = self.completion_time - self.arrival_time
        self.waiting_time = self.turnaround_time - self.burst_time

    def reset(self):
        """
        Reset this process back to its original state.
        Call this before running the SAME process list through a different
        algorithm (e.g. FCFS, then RR, then Adaptive RR), otherwise leftover
        state from a previous run will corrupt results.
        """
        self.remaining_time = self.burst_time
        self.completion_time = 0
        self.waiting_time = 0
        self.turnaround_time = 0
        self.response_time = -1
        self.first_run = True
        self.context_switches = 0

    def to_dict(self):
        """Export process metrics as a dict — used for CSV export / graphing / reports."""
        return {
            "pid": self.pid,
            "arrival_time": self.arrival_time,
            "burst_time": self.burst_time,
            "priority": self.priority,
            "completion_time": self.completion_time,
            "waiting_time": self.waiting_time,
            "turnaround_time": self.turnaround_time,
            "response_time": self.response_time,
            "context_switches": self.context_switches,
        }

    def __repr__(self):
        return (f"Process(pid={self.pid}, arrival={self.arrival_time}, "
                f"burst={self.burst_time}, remaining={self.remaining_time})")


# ---------------------------------------------------------------------------
# Input mechanisms
# ---------------------------------------------------------------------------

def _check_unique_pids(processes):
    """Raises an error if duplicate PIDs are found in a process list."""
    seen = set()
    for p in processes:
        if p.pid in seen:
            raise ValueError(f"Duplicate PID found: '{p.pid}'. All PIDs must be unique.")
        seen.add(p.pid)


def get_manual_input():
    """Manually enter process data via terminal input, with basic error handling."""
    processes = []
    while True:
        try:
            n = int(input("Enter number of processes: "))
            if n <= 0:
                print("Please enter a number greater than 0.")
                continue
            break
        except ValueError:
            print("Invalid number, please try again.")

    for i in range(n):
        pid = f"P{i + 1}"
        while True:
            try:
                arrival_time = int(input(f"Enter arrival time for {pid}: "))
                burst_time = int(input(f"Enter burst time for {pid}: "))
                priority = int(input(f"Enter priority for {pid} (lower is better): "))
                processes.append(Process(pid, arrival_time, burst_time, priority))
                break
            except ValueError as e:
                print(f"Invalid input ({e}). Please re-enter values for {pid}.")

    _check_unique_pids(processes)
    return processes


def get_input_from_file(filepath):
    """
    Read process data from a CSV file.
    Expected format (no header): pid,arrival_time,burst_time
    Example line: P1,0,5
    Skips blank lines and lines starting with '#'. Raises clear errors on bad rows.
    """
    processes = []
    with open(filepath, "r") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [x.strip() for x in line.split(",")]
            if len(parts) != 3:
                raise ValueError(
                    f"Malformed line {line_num} in {filepath}: '{line}' "
                    f"(expected format: pid,arrival_time,burst_time)"
                )
            pid, arrival_time, burst_time = parts
            try:
                processes.append(Process(pid, int(arrival_time), int(burst_time)))
            except ValueError as e:
                raise ValueError(f"Error on line {line_num} in {filepath}: {e}")

    if not processes:
        raise ValueError(f"No valid process data found in {filepath}")

    _check_unique_pids(processes)
    return processes


def get_sample_processes():
    """Returns a hardcoded sample set of processes for quick smoke-testing/demo."""
    sample_data = [
        ("P1", 0, 5),
        ("P2", 1, 3),
        ("P3", 2, 8),
        ("P4", 3, 6),
    ]
    return [Process(pid, arrival, burst) for pid, arrival, burst in sample_data]


def clone_process_list(processes):
    """
    Returns a fresh, independent copy of a process list.
    Use this when you need to run the SAME workload through multiple
    algorithms without one run's state affecting another
    (e.g. Person 4 running FCFS, RR, and Adaptive RR back-to-back for comparison).
    """
    return [Process(p.pid, p.arrival_time, p.burst_time, p.priority) for p in processes]


# ---------------------------------------------------------------------------
# Ready Queue framework
# ---------------------------------------------------------------------------

class ReadyQueue:
    """Basic ready-queue framework used by all scheduling algorithms."""

    def __init__(self):
        self.queue = deque()

    def add(self, process):
        self.queue.append(process)

    def pop(self):
        """Removes and returns the process at the front of the queue."""
        return self.queue.popleft() if self.queue else None

    def peek(self):
        return self.queue[0] if self.queue else None

    def is_empty(self):
        return len(self.queue) == 0

    def size(self):
        return len(self.queue)

    def __repr__(self):
        return f"ReadyQueue({list(self.queue)})"


# ---------------------------------------------------------------------------
# Quick test when running this file directly
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    processes = get_sample_processes()
    print("Sample Processes:")
    for p in processes:
        print(p)

    rq = ReadyQueue()
    for p in processes:
        rq.add(p)
    print("\nReady Queue:", rq)

    print("\nExported as dict (for CSV/report use):")
    for p in processes:
        print(p.to_dict())

    print("\nTesting mark_dispatched / mark_preempted / mark_completed:")
    p1 = processes[0]
    p1.mark_dispatched(current_time=0)
    print("After first dispatch:", p1.response_time, p1.context_switches)
    p1.mark_preempted()
    print("After preemption:", p1.context_switches)
    p1.mark_completed(current_time=10)
    print("After completion:", p1.to_dict())