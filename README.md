# 🛸 Adaptive Round Robin & Ultimate OS Scheduler Simulator

An industry-grade Operating System Scheduling engine and visualizer built for Advanced OS Research. 
This simulator implements 5 core scheduling algorithms and visualizes their execution via a custom-built, React-powered Cyberpunk HUD.

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## 🔬 Supported Algorithms
1. **First-Come, First-Serve (FCFS)**
2. **Shortest Job First (SJF) [Non-Preemptive]**
3. **Priority Scheduling [Non-Preemptive]**
4. **Standard Round Robin (RR)**
5. **✨ Adaptive Round Robin (ARR)** 

### The Adaptive Round Robin Engine
Unlike Standard RR which relies on a static Time Quantum ($Q$), our **Adaptive Round Robin** dynamically calculates optimal time slices for every process using an **Exponentially Weighted Moving Average (EWMA)** and **Ready-Queue Pressure calculations**.

#### 1. EWMA Calculation
The optimal quantum is influenced by recent burst history:
$$ EWMA_n = \alpha \cdot Burst_{n} + (1 - \alpha) \cdot EWMA_{n-1} $$
Where $\alpha$ determines the weight given to the most recent CPU burst.

#### 2. Queue Pressure Scaling
Under heavy system load, the time quantum dynamically compresses to maintain fast response times:
$$ Pressure Factor = e^{-\beta \cdot \max(0, N - 1)} $$
Where $N$ is the number of active processes, and $\beta$ controls the strictness of the scaling.

---

## 🚀 Getting Started

### Method 1: The One-Click Docker Setup (Recommended)
If you have Docker Desktop installed, you can boot the entire system (Frontend + Backend) instantly:
```bash
docker compose up --build
```
- Open **http://localhost:5173** to access the Alien HUD interface.
- Open **http://localhost:8000/docs** to access the OpenAPI Swagger documentation.

### Method 2: Manual Installation
If you prefer running it natively on Windows/Linux:

**1. Start the Python API**
```bash
# In Terminal 1
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**2. Start the React UI**
```bash
# In Terminal 2
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing
The engine is rigorously tested using `pytest`. We mathematically verify the Waiting Time, Turnaround Time, and Context Switches for all 5 algorithms.
```bash
pytest test_schedulers.py -v
```

---

## 👽 The "Alien HUD" Dashboard
The frontend is completely custom-built using Vite, React, Framer-Motion, Recharts, and TailwindCSS.
- **5-Axis Radar Matrix**: Instantly compare FCFS vs SJF vs Priority vs RR vs ARR.
- **Laser Timeline**: Animated Gantt charts for millisecond-by-millisecond execution playback.
- **CSV Data Dumps**: Export raw metrics instantly for your research papers.
