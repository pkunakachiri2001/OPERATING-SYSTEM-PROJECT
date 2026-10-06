import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Plus, Trash2, Settings, Activity, Info, List, Clock, Cpu, BarChart2, ShieldAlert, Download, Copy, Pause } from 'lucide-react';
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
    const saved = localStorage.getItem('os_sim_processes_hud_v3');
    if (saved) return JSON.parse(saved);
    return [
      { pid: 'P1', arrival_time: 0, burst_time: 3, priority: 2 },
      { pid: 'P2', arrival_time: 0, burst_time: 25, priority: 4 },
      { pid: 'P3', arrival_time: 1, burst_time: 2, priority: 1 },
      { pid: 'P4', arrival_time: 2, burst_time: 4, priority: 2 },
      { pid: 'P5', arrival_time: 3, burst_time: 30, priority: 5 },
      { pid: 'P6', arrival_time: 4, burst_time: 3, priority: 1 },
      { pid: 'P7', arrival_time: 5, burst_time: 15, priority: 3 },
      { pid: 'P8', arrival_time: 6, burst_time: 2, priority: 1 },
      { pid: 'P9', arrival_time: 8, burst_time: 10, priority: 4 },
      { pid: 'P10', arrival_time: 10, burst_time: 1, priority: 1 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('os_sim_processes_hud_v3', JSON.stringify(processes));
  }, [processes]);
  
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.2);
  const [rrQuantum, setRrQuantum] = useState(10);
  const [qMin, setQMin] = useState(2);
  const [qMax, setQMax] = useState(10);

  const [results, setResults] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState('adaptive_rr');

  // Playback state
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
      setPlaybackTime(0);
      setIsPlaying(false);
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

  const colors = [
    'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)] border-blue-300/30',
    'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] border-emerald-300/30',
    'bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)] border-purple-300/30',
    'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] border-amber-300/30',
    'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.5)] border-rose-300/30',
    'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] border-cyan-300/30',
    'bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)] border-indigo-300/30',
    'bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 shadow-[0_0_12px_rgba(192,38,211,0.5)] border-fuchsia-300/30'
  ];

  // Derived normalized Gantt
  const rawGantt = results && results[activeAlgorithm] ? results[activeAlgorithm].gantt : [];
  const normalizedGantt = rawGantt.map(b => Array.isArray(b) ? { pid: b[0], start: b[1], end: b[2] } : b);
  const totalTime = normalizedGantt.length > 0 ? normalizedGantt[normalizedGantt.length - 1].end : 1;
  const uniquePids = [...new Set(processes.map(p => p.pid))];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= totalTime) {
            setIsPlaying(false);
            return totalTime;
          }
          return prev + 1;
        });
      }, 1000); // 1000ms real time per 1ms simulation time (as requested: 1 sec = 1 ms)
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalTime]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playbackTime >= totalTime) setPlaybackTime(0);
      setIsPlaying(true);
    }
  };

  const exportToCSV = () => {
    if (!results) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Algorithm,Avg Waiting Time,Avg Turnaround Time,Avg Response Time,Context Switches\n";
    Object.keys(algorithmNames).forEach(key => {
      const m = results[key].metrics;
      csvContent += `${algorithmNames[key]},${m.avg_waiting_time},${m.avg_turnaround_time},${m.avg_response_time},${m.total_context_switches}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Scheduler_Metrics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMetrics = () => {
    if (!results) return;
    let text = "Algorithm\tAvg Waiting\tAvg Turnaround\tAvg Response\tContext Switches\n";
    Object.keys(algorithmNames).forEach(key => {
      const m = results[key].metrics;
      text += `${algorithmNames[key]}\t${m.avg_waiting_time.toFixed(2)}\t${m.avg_turnaround_time.toFixed(2)}\t${m.avg_response_time.toFixed(2)}\t${m.total_context_switches}\n`;
    });
    navigator.clipboard.writeText(text);
    alert("Metrics copied to clipboard!");
  };

  const getProcessColor = (pid) => {
    const idx = uniquePids.indexOf(pid);
    return idx >= 0 ? colors[idx % colors.length] : 'bg-slate-700';
  };

  const renderStatePanel = () => {
    if (!results || normalizedGantt.length === 0) return null;

    // A block is running if we are strictly inside its execution window.
    // If playbackTime == totalTime, no process is running (all complete).
    const runningBlock = playbackTime < totalTime 
      ? normalizedGantt.find(b => b.start <= playbackTime && playbackTime < b.end)
      : null;
    const runningPid = runningBlock ? runningBlock.pid : null;

    const pidEndTimes = {};
    normalizedGantt.forEach(b => {
      pidEndTimes[b.pid] = Math.max(pidEndTimes[b.pid] || 0, b.end);
    });

    const completed = new Set();
    const ready = new Set();

    // Loop through all processes. If they arrived, determine state.
    processes.forEach(p => {
      if (p.arrival_time <= playbackTime) {
        if (pidEndTimes[p.pid] !== undefined && pidEndTimes[p.pid] <= playbackTime) {
          completed.add(p.pid);
        } else if (p.pid !== runningPid) {
          ready.add(p.pid);
        }
      }
    });

    return (
      <div className="flex flex-col gap-4 bg-slate-950 p-6 rounded-lg border border-slate-800 mt-6 shadow-inner">
        
        {/* Ready Queue */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready Queue</div>
          <div className="flex-1 flex gap-2 min-h-[52px] bg-slate-900 border border-slate-800 rounded p-2 items-center">
            {ready.size > 0 ? Array.from(ready).map(pid => (
              <div key={pid} className={`w-12 h-8 flex items-center justify-center rounded text-white font-bold text-xs shadow-sm ${getProcessColor(pid)}`}>
                {pid}
              </div>
            )) : <span className="text-slate-600 text-xs italic ml-2">Empty</span>}
          </div>
        </div>

        {/* CPU Running */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs font-semibold text-blue-500 uppercase tracking-wider">CPU (Running)</div>
          <div className="flex-1 flex gap-2 min-h-[64px] bg-slate-900 border border-blue-900/40 rounded p-2 items-center relative overflow-hidden">
             <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
             {runningPid ? (
              <div className={`w-24 h-12 flex items-center justify-center rounded text-white font-bold text-lg shadow-md border-2 border-white/20 animate-pulse ${getProcessColor(runningPid)}`}>
                {runningPid}
              </div>
             ) : <span className="text-slate-600 text-xs italic ml-2">IDLE</span>}
          </div>
        </div>

        {/* Completed */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</div>
          <div className="flex-1 flex gap-2 min-h-[52px] bg-slate-900 border border-slate-800 rounded p-2 items-center flex-wrap">
            {completed.size > 0 ? Array.from(completed).map(pid => (
              <div key={pid} className="w-10 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 font-medium text-xs border border-slate-700">
                {pid}
              </div>
            )) : <span className="text-slate-600 text-xs italic ml-2">None</span>}
          </div>
        </div>
        
      </div>
    );
  };

  const renderTimeline = () => {
    if (!results || !results[activeAlgorithm]) return null;

    const getTickInterval = (maxTime) => {
      if (maxTime <= 20) return 2;
      if (maxTime <= 50) return 5;
      if (maxTime <= 100) return 10;
      return 20;
    };
    const tickInterval = getTickInterval(totalTime);
    const ticks = [];
    for (let t = 0; t <= totalTime; t += tickInterval) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] !== totalTime) {
      ticks.push(totalTime);
    }

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Execution Playback
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-slate-400 text-sm font-mono">T = {playbackTime} ms</div>
            <button 
              onClick={() => {
                setPlaybackTime(0);
                setIsPlaying(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition border border-slate-700"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button 
              onClick={togglePlayback} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition shadow-sm"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play (1s = 1ms)'}
            </button>
          </div>
        </div>
        
        {/* State Panel Queue visualization */}
        {renderStatePanel()}

        {/* Dynamic Premium Gantt Chart */}
        <div className="relative overflow-x-auto mt-8 mb-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 shadow-inner">
          <div className="min-w-[800px] pb-6 flex">
            
            {/* Y-Axis Labels (PIDs) */}
            <div className="w-16 flex flex-col gap-3 pt-2 shrink-0 border-r border-slate-700/50 pr-4 mr-4 z-20">
              {uniquePids.map(pid => (
                <div key={pid} className="h-12 flex items-center justify-end text-sm font-bold text-slate-300">
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded shadow-sm border border-slate-700">{pid}</span>
                </div>
              ))}
            </div>

            {/* Timeline Area */}
            <div className="flex-1 relative pt-2">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {ticks.map((t, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-slate-700/30" style={{ left: `${(t / totalTime) * 100}%` }}></div>
                ))}
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-3 z-10 relative">
                {uniquePids.map(pid => (
                  <div key={pid} className="h-12 relative bg-slate-900/40 rounded-lg border border-slate-800/50 overflow-visible group/row backdrop-blur-sm">
                    {normalizedGantt.filter(b => b.pid === pid).map((block, i) => {
                      if (block.start >= playbackTime) return null;

                      // Truncate the block width up to the current playback time
                      const displayEnd = Math.min(block.end, playbackTime);
                      const widthPct = ((displayEnd - block.start) / totalTime) * 100;
                      const startPct = (block.start / totalTime) * 100;
                      const color = getProcessColor(block.pid);
                      const isRunning = displayEnd === playbackTime && playbackTime < block.end;

                      return (
                        <div
                          key={i}
                          className={`absolute top-1.5 bottom-1.5 rounded-md border group/block hover:brightness-125 hover:z-30 ${color} transition-all duration-1000 ease-linear cursor-pointer shadow-lg z-20 overflow-hidden`}
                          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        >
                          {/* Active Running Pulse Effect */}
                          {isRunning && (
                             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          )}

                          {/* Premium Tooltip */}
                          <div className="absolute bottom-full mb-3 hidden group-hover/block:block w-52 bg-slate-900/95 text-slate-200 p-3 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-slate-600 pointer-events-none left-1/2 -translate-x-1/2 backdrop-blur-md">
                            <div className="font-bold text-white mb-2 flex items-center justify-between border-b border-slate-700 pb-2">
                              <span>{block.pid} Burst</span>
                              <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-300 font-mono">{block.end - block.start}ms</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Start</span>
                                <span className="font-mono text-emerald-400 text-sm">{block.start}ms</span>
                              </div>
                              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">End</span>
                                <span className="font-mono text-rose-400 text-sm">{block.end}ms</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* Ticks with proper alignment */}
              <div className="relative h-6 mt-3 flex text-xs text-slate-400 font-mono">
                {ticks.map((t, i) => {
                  let alignClass = "-translate-x-1/2 text-center";
                  if (i === 0) alignClass = "translate-x-0 text-left ml-[1px]";
                  if (i === ticks.length - 1) alignClass = "-translate-x-full text-right mr-[1px]";
                  return (
                    <div key={i} className="absolute flex flex-col items-center" style={{ left: `${(t / totalTime) * 100}%` }}>
                      <div className="w-px h-2 bg-slate-600"></div>
                      <span className={`absolute top-2.5 ${alignClass} w-16`}>{t}ms</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Algorithm Tabs */}
        <div className="flex flex-wrap gap-2 mt-2 pt-6 border-t border-slate-800">
          {Object.entries(algorithmNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => {
                setActiveAlgorithm(key);
                setPlaybackTime(0);
                setIsPlaying(false);
              }}
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
    const minResponse = Math.min(...algos.map(a => a.avg_response_time));

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-500" /> Algorithm Comparison
          </h2>
          <div className="flex gap-2">
            <button onClick={copyMetrics} className="text-sm text-slate-400 hover:text-slate-200 transition flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700 bg-slate-800">
              <Copy size={14} /> Copy
            </button>
            <button onClick={exportToCSV} className="text-sm text-slate-400 hover:text-slate-200 transition flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700 bg-slate-800">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
        
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
                  <td className={`px-4 py-3 ${a.avg_response_time === minResponse ? 'text-emerald-400 font-bold' : ''}`}>{a.avg_response_time.toFixed(1)} ms</td>
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
                <input 
                  type="number" 
                  min="1" 
                  value={rrQuantum} 
                  onChange={e => setRrQuantum(parseInt(e.target.value) || 1)} 
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
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
