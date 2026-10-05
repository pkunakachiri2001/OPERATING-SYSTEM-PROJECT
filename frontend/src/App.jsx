import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Plus, Trash2, Settings, Activity, Info, List, Clock, Cpu, BarChart2, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const Tooltip = ({ text, children }) => (
  <div className="group relative flex items-center cursor-help">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded shadow-lg z-50 text-center pointer-events-none">
      {text}
    </div>
  </div>
);

function App() {
  const [processes, setProcesses] = useState(() => {
    const saved = localStorage.getItem('os_sim_processes_hud');
    if (saved) return JSON.parse(saved);
    return [
      { pid: 'P1', arrival_time: 0, burst_time: 5, priority: 2 },
      { pid: 'P2', arrival_time: 1, burst_time: 3, priority: 1 },
      { pid: 'P3', arrival_time: 2, burst_time: 8, priority: 4 },
      { pid: 'P4', arrival_time: 3, burst_time: 6, priority: 3 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('os_sim_processes_hud', JSON.stringify(processes));
  }, [processes]);
  
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.2);
  const [rrQuantum, setRrQuantum] = useState(4);
  const [qMin, setQMin] = useState(2);
  const [qMax, setQMax] = useState(10);

  const [results, setResults] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState('adaptive_rr');

  const loadPreset = (type) => {
    let newProcs = [];
    switch (type) {
      case 'cpu':
        newProcs = [
          { pid: 'P1', arrival_time: 0, burst_time: 15, priority: 1 },
          { pid: 'P2', arrival_time: 2, burst_time: 20, priority: 3 },
          { pid: 'P3', arrival_time: 4, burst_time: 12, priority: 2 },
        ];
        break;
      case 'io':
        newProcs = Array.from({length: 6}, (_, i) => ({
          pid: `P${i+1}`, arrival_time: i, burst_time: 2 + (i % 3), priority: (i % 4) + 1
        }));
        break;
      case 'stress':
        newProcs = Array.from({length: 8}, (_, i) => ({
          pid: `P${i+1}`, arrival_time: Math.floor(i/2), burst_time: 1 + (i % 2), priority: Math.floor(Math.random() * 5) + 1
        }));
        break;
    }
    setProcesses(newProcs);
    executeSimulation(newProcs);
  };

  const executeSimulation = async (procs = processes) => {
    if (procs.length === 0) return;
    setSimulating(true);
    try {
      const res = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes: procs, alpha, beta, q_min: qMin, q_max: qMax, rr_quantum: rrQuantum })
      });
      const data = await res.json();
      setResults(data);
      setSimulating(false);
    } catch (e) {
      alert("Error connecting to backend API.");
      setSimulating(false);
    }
  };

  const updateProcess = (index, field, value) => {
    const newProcs = [...processes];
    if (value < 0 && field !== 'priority') value = 0;
    if (field === 'burst_time' && value < 1) value = 1;
    if (field === 'priority' && value < 1) value = 1;
    newProcs[index][field] = value;
    setProcesses(newProcs);
  };

  const addProcess = () => {
    setProcesses([...processes, { pid: `P${processes.length + 1}`, arrival_time: 0, burst_time: 1, priority: 1 }]);
  };

  const removeProcess = (index) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const algorithmNames = {
    fcfs: "First-Come, First-Serve",
    sjf: "Shortest Job First",
    priority: "Priority Scheduling",
    rr: "Standard Round Robin",
    adaptive_rr: "Adaptive Round Robin"
  };

  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];

  const renderTimeline = () => {
    if (!results || !results[activeAlgorithm]) return null;
    const gantt = results[activeAlgorithm].gantt;
    const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 1;
    const uniquePids = [...new Set(processes.map(p => p.pid))];

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <Activity size={18} className="text-blue-500" /> CPU Execution Timeline
        </h2>
        <div className="relative pt-6 pb-8 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="relative h-16 bg-slate-950 rounded border border-slate-800 flex overflow-hidden">
              {/* Grid Lines */}
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-slate-800/50" style={{ left: `${i * 10}%` }}></div>
              ))}
              
              {gantt.map((block, i) => {
                const widthPct = ((block.end - block.start) / totalTime) * 100;
                const pidIndex = uniquePids.indexOf(block.pid);
                const color = colors[pidIndex % colors.length];
                return (
                  <div
                    key={i}
                    className={`h-full flex items-center justify-center text-xs font-medium text-white border-r border-slate-900 group relative transition-all hover:brightness-110 cursor-pointer ${color}`}
                    style={{ width: `${widthPct}%` }}
                  >
                    {widthPct > 3 ? block.pid : ''}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 w-48 bg-slate-800 text-slate-200 p-3 rounded shadow-lg border border-slate-700 pointer-events-none">
                      <div className="font-bold text-blue-400 mb-1">{block.pid}</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-slate-400">Start:</span><span>{block.start} ms</span>
                        <span className="text-slate-400">End:</span><span>{block.end} ms</span>
                        <span className="text-slate-400">Duration:</span><span>{block.end - block.start} ms</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Ticks */}
            <div className="relative h-6 mt-1 flex text-xs text-slate-500">
              <span className="absolute left-0 -translate-x-1/2">0ms</span>
              <span className="absolute left-1/4 -translate-x-1/2">{Math.round(totalTime * 0.25)}ms</span>
              <span className="absolute left-2/4 -translate-x-1/2">{Math.round(totalTime * 0.5)}ms</span>
              <span className="absolute left-3/4 -translate-x-1/2">{Math.round(totalTime * 0.75)}ms</span>
              <span className="absolute right-0 translate-x-1/2">{totalTime}ms</span>
            </div>
          </div>
        </div>
        
        {/* Algorithm Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(algorithmNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setActiveAlgorithm(key)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeAlgorithm === key ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!results) return null;
    const algos = Object.keys(algorithmNames).map(key => ({
      id: key,
      name: algorithmNames[key],
      ...results[key].metrics
    }));

    const minWait = Math.min(...algos.map(a => a.avg_waiting_time));
    const minTurn = Math.min(...algos.map(a => a.avg_turnaround_time));

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <BarChart2 size={18} className="text-blue-500" /> Algorithm Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Algorithm</th>
                <th className="px-4 py-3">Avg Waiting</th>
                <th className="px-4 py-3">Avg Turnaround</th>
                <th className="px-4 py-3">Avg Response</th>
                <th className="px-4 py-3 rounded-tr-lg">Context Switches</th>
              </tr>
            </thead>
            <tbody>
              {algos.map((a) => (
                <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-200">{a.name}</td>
                  <td className={`px-4 py-3 ${a.avg_waiting_time === minWait ? 'text-emerald-400 font-bold' : ''}`}>{a.avg_waiting_time.toFixed(1)} ms</td>
                  <td className={`px-4 py-3 ${a.avg_turnaround_time === minTurn ? 'text-emerald-400 font-bold' : ''}`}>{a.avg_turnaround_time.toFixed(1)} ms</td>
                  <td className="px-4 py-3">{a.avg_response_time.toFixed(1)} ms</td>
                  <td className="px-4 py-3">{a.total_context_switches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={algos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.split(' ')[0]} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9'}} />
              <Legend wrapperStyle={{fontSize: '12px'}} />
              <Bar dataKey="avg_waiting_time" name="Waiting Time (ms)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_turnaround_time" name="Turnaround Time (ms)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
              <Cpu className="text-blue-500" size={28} /> 
              CPU Scheduling Simulator
            </h1>
            <p className="text-slate-400 mt-1">Compare scheduling algorithms through interactive workload simulation</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <select 
              onChange={(e) => loadPreset(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>Load Scenario...</option>
              <option value="cpu">CPU Heavy Workload</option>
              <option value="io">I/O Bound Workload</option>
              <option value="stress">Stress Test</option>
            </select>
            <button 
              onClick={() => executeSimulation(processes)}
              disabled={simulating || processes.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Play size={16} />
              {simulating ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </header>

        {results && renderTimeline()}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Workload Configuration */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <List size={18} className="text-blue-500" /> Process Queue
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setProcesses([])} className="text-sm text-slate-400 hover:text-rose-400 transition flex items-center gap-1 px-2 py-1">
                  <Trash2 size={14} /> Clear
                </button>
                <button onClick={addProcess} className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700">
                  <Plus size={14} /> Add Process
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3 font-medium">PID</th>
                    <th className="pb-3 font-medium">Arrival Time (ms)</th>
                    <th className="pb-3 font-medium">Burst Time (ms)</th>
                    <th className="pb-3 font-medium">Priority (Lower = Higher Prio)</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        <ShieldAlert size={24} className="mx-auto mb-2 opacity-50" />
                        No processes in queue. Add a process or load a scenario.
                      </td>
                    </tr>
                  )}
                  {processes.map((p, i) => (
                    <tr key={i} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-mono text-slate-300">{p.pid}</td>
                      <td className="py-3">
                        <input type="number" min="0" value={p.arrival_time} onChange={(e) => updateProcess(i, 'arrival_time', parseInt(e.target.value) || 0)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3">
                        <input type="number" min="1" value={p.burst_time} onChange={(e) => updateProcess(i, 'burst_time', parseInt(e.target.value) || 1)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3">
                        <input type="number" min="1" value={p.priority} onChange={(e) => updateProcess(i, 'priority', parseInt(e.target.value) || 1)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => removeProcess(i)} className="text-slate-500 hover:text-rose-400 transition p-1 opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
              <Settings size={18} className="text-blue-500" /> Scheduler Config
            </h2>
            
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                    Base Quantum
                    <Tooltip text="The standard time slice given to each process in Round Robin."><Info size={14} className="text-slate-500" /></Tooltip>
                  </label>
                  <span className="text-blue-400 font-mono text-sm">{rrQuantum} ms</span>
                </div>
                <input type="range" min="1" max="20" step="1" value={rrQuantum} onChange={e => setRrQuantum(parseInt(e.target.value))} className="w-full accent-blue-500" />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Adaptive RR Parameters</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                      EWMA Alpha
                      <Tooltip text="Controls how strongly recent CPU bursts influence the dynamic quantum. Higher = more sensitive to recent history."><Info size={14} className="text-slate-500" /></Tooltip>
                    </label>
                    <span className="text-emerald-400 font-mono text-sm">{alpha.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                      Queue Pressure Beta
                      <Tooltip text="Determines how aggressively the quantum is reduced when many processes are waiting in the ready queue."><Info size={14} className="text-slate-500" /></Tooltip>
                    </label>
                    <span className="text-purple-400 font-mono text-sm">{beta.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={beta} onChange={e => setBeta(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
              </div>
            </div>
            
            {results && results.adaptive_rr && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-4 rounded border border-slate-800">
                   <h3 className="text-xs font-semibold text-slate-400 mb-2">Adaptive RR Insights</h3>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     The Adaptive algorithm dynamically scales quantums based on historical burst patterns (\u03B1={alpha}) and queue contention (\u03B2={beta}). 
                     It completed the workload with an average turnaround of <strong className="text-slate-300">{results.adaptive_rr.metrics.avg_turnaround_time.toFixed(1)}ms</strong>.
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {renderComparison()}

      </div>
    </div>
  );
}

export default App;
