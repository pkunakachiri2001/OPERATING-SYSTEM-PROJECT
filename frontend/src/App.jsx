import { useState, useEffect, useRef } from 'react'
import { Settings, Play, Server, Crosshair, Download, Trash2, Info, Terminal, ShieldAlert, Activity, Copy, BarChart3, Shuffle, Trophy, Cpu, Zap, Table } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const InfoTooltip = ({ text }) => (
  <div className="group relative inline-flex ml-2 cursor-help">
    <Info size={12} className="text-cyan-400 opacity-50 hover:opacity-100 transition" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-black border border-cyan-400 text-cyan-100 text-[10px] uppercase shadow-[0_0_15px_rgba(0,240,255,0.2)] z-20 pointer-events-none">
      {text}
    </div>
  </div>
)

const DecodingText = ({ text }) => {
  const [display, setDisplay] = useState(text.replace(/./g, '0'))
  useEffect(() => {
    let iteration = 0
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*"
    const interval = setInterval(() => {
      setDisplay(text.split('').map((letter, index) => {
        if (index < iteration) return text[index]
        return chars[Math.floor(Math.random() * 42)]
      }).join(''))
      if (iteration >= text.length) clearInterval(interval)
      iteration += 1 / 3
    }, 30)
    return () => clearInterval(interval)
  }, [text])
  return <span>{display}</span>
}

function App() {
  const [processes, setProcesses] = useState(() => {
    const saved = localStorage.getItem('os_sim_processes_hud')
    if (saved) return JSON.parse(saved)
    return [
      { pid: 'P1', arrival_time: 0, burst_time: 5, priority: 2 },
      { pid: 'P2', arrival_time: 1, burst_time: 3, priority: 1 },
      { pid: 'P3', arrival_time: 2, burst_time: 8, priority: 4 },
      { pid: 'P4', arrival_time: 3, burst_time: 6, priority: 3 },
    ]
  })

  useEffect(() => {
    localStorage.setItem('os_sim_processes_hud', JSON.stringify(processes))
  }, [processes])
  
  const [alpha, setAlpha] = useState(0.5)
  const [beta, setBeta] = useState(0.2)
  const [rrQuantum, setRrQuantum] = useState(4)
  const [qMin, setQMin] = useState(2)
  const [qMax, setQMax] = useState(10)

  const [results, setResults] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [chartType, setChartType] = useState('radar')
  const [playingGantt, setPlayingGantt] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (msg) => {
    setLogs(prev => [...prev, { time: new Date().toISOString().split('T')[1].slice(0, 12), msg }].slice(-6))
  }

  const loadPreset = async (type) => {
    let newProcs = []
    switch (type) {
      case 'cpu':
        newProcs = [
          { pid: 'P1', arrival_time: 0, burst_time: 15, priority: 1 },
          { pid: 'P2', arrival_time: 2, burst_time: 20, priority: 3 },
          { pid: 'P3', arrival_time: 4, burst_time: 12, priority: 2 },
        ]
        break
      case 'io':
        newProcs = Array.from({length: 6}, (_, i) => ({
          pid: `P${i+1}`, arrival_time: i, burst_time: 2 + (i % 3), priority: (i % 4) + 1
        }))
        break
      case 'spike':
        newProcs = [
          { pid: 'P1', arrival_time: 0, burst_time: 2, priority: 3 },
          { pid: 'P2', arrival_time: 1, burst_time: 25, priority: 1 },
          { pid: 'P3', arrival_time: 2, burst_time: 1, priority: 4 },
          { pid: 'P4', arrival_time: 3, burst_time: 3, priority: 2 },
        ]
        break
      case 'stress':
        newProcs = Array.from({length: 8}, (_, i) => ({
          pid: `P${i+1}`, arrival_time: Math.floor(i/2), burst_time: 1 + (i % 2), priority: Math.floor(Math.random() * 5) + 1
        }))
        break
    }
    setProcesses(newProcs)
    executeSimulation(newProcs)
  }

  const executeSimulation = async (procs = processes) => {
    if (procs.length === 0) return
    setSimulating(true)
    setScanProgress(0)
    setLogs([])
    addLog(`> INJECTING ${procs.length} PROCESSES INTO MATRIX`)
    
    const scanInterval = setInterval(() => {
      setScanProgress(p => {
        if (p < 30) addLog(`> CALCULATING EWMA COEFFICIENTS...`)
        else if (p < 60) addLog(`> OPTIMIZING QUANTUMS...`)
        else if (p < 90) addLog(`> DISPATCHING THREADS...`)
        return Math.min(p + 15, 100)
      })
    }, 150)

    try {
      const res = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes: procs, alpha, beta, q_min: qMin, q_max: qMax, rr_quantum: rrQuantum })
      })
      const data = await res.json()
      setTimeout(() => {
        clearInterval(scanInterval)
        addLog(`> EXECUTION COMPLETE. MATRIX RENDERED.`)
        setResults(data)
        setSimulating(false)
      }, 1500)
    } catch (e) {
      clearInterval(scanInterval)
      addLog(`> [ERROR] CONNECTION TO KERNEL LOST.`)
      alert("Error connecting to backend API.")
      setSimulating(false)
    }
  }

  const updateProcess = (index, field, value) => {
    const newProcs = [...processes]
    if (value < 0 && field !== 'priority') value = 0 // Arrival time >= 0
    if (field === 'burst_time' && value < 1) value = 1
    if (field === 'priority' && value < 1) value = 1 // Let priority start at 1
    newProcs[index][field] = value
    setProcesses(newProcs)
  }

  const addProcess = () => {
    setProcesses([...processes, { pid: `P${processes.length + 1}`, arrival_time: 0, burst_time: 1, priority: 1 }])
  }

  const removeProcess = (index) => {
    setProcesses(processes.filter((_, i) => i !== index))
  }

  const randomizePriorities = () => {
    setProcesses(processes.map(p => ({...p, priority: Math.floor(Math.random() * 5) + 1})))
  }

  const exportToCSV = () => {
    if (!results) return
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "ALGORITHM,WAIT,TURNAROUND,RESPONSE,SWITCHES\n"
    csvContent += `FCFS,${results.fcfs.metrics.avg_waiting_time},${results.fcfs.metrics.avg_turnaround_time},${results.fcfs.metrics.avg_response_time},${results.fcfs.metrics.total_context_switches}\n`
    csvContent += `RR_Q${rrQuantum},${results.rr.metrics.avg_waiting_time},${results.rr.metrics.avg_turnaround_time},${results.rr.metrics.avg_response_time},${results.rr.metrics.total_context_switches}\n`
    csvContent += `ARR,${results.adaptive_rr.metrics.avg_waiting_time},${results.adaptive_rr.metrics.avg_turnaround_time},${results.adaptive_rr.metrics.avg_response_time},${results.adaptive_rr.metrics.total_context_switches}\n`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "SYS_METRICS.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyMetrics = () => {
    if (!results) return
    let text = "ALGORITHM\tWAIT\tTURN\tRESP\tCTX_SW\n"
    text += `FCFS\t${results.fcfs.metrics.avg_waiting_time}\t${results.fcfs.metrics.avg_turnaround_time}\t${results.fcfs.metrics.avg_response_time}\t${results.fcfs.metrics.total_context_switches}\n`
    text += `SJF\t${results.sjf.metrics.avg_waiting_time}\t${results.sjf.metrics.avg_turnaround_time}\t${results.sjf.metrics.avg_response_time}\t${results.sjf.metrics.total_context_switches}\n`
    text += `PRIO\t${results.priority.metrics.avg_waiting_time}\t${results.priority.metrics.avg_turnaround_time}\t${results.priority.metrics.avg_response_time}\t${results.priority.metrics.total_context_switches}\n`
    text += `RR\t${results.rr.metrics.avg_waiting_time}\t${results.rr.metrics.avg_turnaround_time}\t${results.rr.metrics.avg_response_time}\t${results.rr.metrics.total_context_switches}\n`
    text += `ARR\t${results.adaptive_rr.metrics.avg_waiting_time}\t${results.adaptive_rr.metrics.avg_turnaround_time}\t${results.adaptive_rr.metrics.avg_response_time}\t${results.adaptive_rr.metrics.total_context_switches}\n`
    navigator.clipboard.writeText(text)
    alert("Metrics copied to clipboard!")
  }

  const renderLaserTimeline = (algoName, gantt) => {
    const totalTime = gantt[gantt.length - 1]?.end || 1
    const pids = [...new Set(gantt.map(g => g.pid))].sort()
    const isPlaying = playingGantt === algoName
    
    return (
      <div className="mt-6 border-t border-cyan-900/50 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-[10px] text-cyan-500 uppercase tracking-widest flex items-center gap-2">
            <Crosshair size={12} /> TIMELINE.EXEC
          </div>
          <button 
            onClick={() => setPlayingGantt(isPlaying ? null : algoName)}
            className="text-[9px] uppercase tracking-widest text-cyan-600 hover:text-cyan-300 transition flex items-center gap-1 border border-cyan-900 px-2 py-0.5"
          >
            <Play size={8} /> {isPlaying ? 'STOP' : 'REPLAY_EXEC'}
          </button>
        </div>
        
        <div className="relative h-8 border-b border-l border-cyan-900/50 flex overflow-hidden">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAwJSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwwIDBoMjB2MTAwSDBWMGgyMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAyNDAsIDI1NSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50" />
          
          {gantt.map((block, i) => {
            const widthPct = ((block.end - block.start) / totalTime) * 100
            const isMagenta = pids.indexOf(block.pid) % 2 === 0
            const colorClass = isMagenta ? 'bg-magenta-500' : 'bg-cyan-500'
            const shadowClass = isMagenta ? 'shadow-[0_0_10px_#FF0055]' : 'shadow-[0_0_10px_#00F0FF]'
            
            return (
              <motion.div
                initial={isPlaying ? { width: 0 } : false}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.1, delay: isPlaying ? i * 0.1 : 0, ease: "linear" }}
                key={isPlaying ? `${algoName}-play-${i}` : `${algoName}-${i}`}
                className={`h-full flex items-center justify-center text-[9px] font-bold text-black border-r border-black relative group ${colorClass} ${shadowClass} opacity-80 hover:opacity-100 transition-opacity`}
              >
                {widthPct > 4 && block.pid}
                
                {/* HUD Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 w-max bg-black text-cyan-400 px-2 py-1 border border-cyan-500 text-[9px] tracking-widest pointer-events-none">
                  [{block.pid}] T:{block.start}-{block.end}
                </div>
              </motion.div>
            )
          })}
        </div>
        <div className="flex justify-between text-[9px] text-cyan-700 mt-1 uppercase">
          <span>0ms</span>
          <span>{totalTime}ms</span>
        </div>
      </div>
    )
  }

  const renderMetricsTable = () => {
    if (!results) return null
    const algos = [
      { id: 'sjf', name: 'SJF' },
      { id: 'adaptive_rr', name: 'ARR' },
      { id: 'fcfs', name: 'FCFS' },
      { id: 'priority', name: 'PRIO' },
      { id: 'rr', name: 'RR' },
    ]
    
    // Find absolute minimums for intelligent highlighting
    const minWait = Math.min(...algos.map(a => results[a.id].metrics.avg_waiting_time))
    const minTurn = Math.min(...algos.map(a => results[a.id].metrics.avg_turnaround_time))
    const minResp = Math.min(...algos.map(a => results[a.id].metrics.avg_response_time))
    const minCtx = Math.min(...algos.map(a => results[a.id].metrics.total_context_switches))

    return (
      <div className="mt-4 p-3 border border-cyan-900 bg-cyan-900/10">
        <h3 className="text-[10px] text-yellow-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <Table size={12} /> METRICS_MATRIX
        </h3>
        <table className="w-full text-left text-[9px] text-cyan-300">
          <thead>
            <tr className="text-cyan-700 border-b border-cyan-900/50">
              <th className="py-1">ALGO</th>
              <th className="py-1">WAIT</th>
              <th className="py-1">TURN</th>
              <th className="py-1">RESP</th>
              <th className="py-1">CTX</th>
            </tr>
          </thead>
          <tbody>
            {algos.map(a => {
              const m = results[a.id].metrics
              return (
                <tr key={a.id} className="border-b border-cyan-900/20 hover:bg-cyan-900/30 transition">
                  <td className="py-1.5 font-bold">{a.name}</td>
                  <td className={`py-1.5 ${m.avg_waiting_time === minWait ? 'text-green-400 font-bold' : ''}`}>{m.avg_waiting_time.toFixed(1)}</td>
                  <td className={`py-1.5 ${m.avg_turnaround_time === minTurn ? 'text-green-400 font-bold' : ''}`}>{m.avg_turnaround_time.toFixed(1)}</td>
                  <td className={`py-1.5 ${m.avg_response_time === minResp ? 'text-green-400 font-bold' : ''}`}>{m.avg_response_time.toFixed(1)}</td>
                  <td className={`py-1.5 ${m.total_context_switches === minCtx ? 'text-green-400 font-bold' : ''}`}>{m.total_context_switches}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTerminal = () => (
    <div className="mt-2 p-2 bg-black border border-cyan-900/50 h-24 overflow-hidden text-[9px] font-mono text-cyan-600">
      {logs.map((l, i) => <div key={i}>{l.time} {l.msg}</div>)}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4 selection:bg-magenta-500/30 overflow-hidden relative">
      
      {/* Background CRT lines effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 z-0"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* HUD Header */}
        <header className="flex justify-between items-end border-b border-cyan-900 pb-4">
          <div>
            <h1 className="text-xl font-bold text-cyan-100 tracking-widest flex items-center gap-3 uppercase">
              <Terminal className="text-magenta-500" size={24} /> 
              <DecodingText text="SYS.KERNEL.SCHEDULER" />
            </h1>
            <p className="text-[10px] text-cyan-700 mt-1 uppercase tracking-widest">Adaptive RR // Module V4.4</p>
          </div>
          <div className="flex gap-4 border-l border-cyan-900 pl-4">
            <button onClick={() => loadPreset('cpu')} className="text-[10px] uppercase tracking-widest text-cyan-600 hover:text-cyan-100 hover:shadow-[0_0_8px_rgba(0,240,255,0.5)] transition px-2 py-1 border border-cyan-900 hover:border-cyan-400">[ CPU_HEAVY ]</button>
            <button onClick={() => loadPreset('io')} className="text-[10px] uppercase tracking-widest text-cyan-600 hover:text-cyan-100 hover:shadow-[0_0_8px_rgba(0,240,255,0.5)] transition px-2 py-1 border border-cyan-900 hover:border-cyan-400">[ IO_BOUND ]</button>
            <button onClick={() => loadPreset('spike')} className="text-[10px] uppercase tracking-widest text-magenta-600 hover:text-magenta-100 hover:shadow-[0_0_8px_rgba(255,0,85,0.5)] transition px-2 py-1 border border-magenta-900 hover:border-magenta-400">[ SPIKE_ANOMALY ]</button>
            <button onClick={() => loadPreset('stress')} className="text-[10px] uppercase tracking-widest text-yellow-600 hover:text-yellow-100 hover:shadow-[0_0_8px_rgba(234,179,8,0.5)] transition px-2 py-1 border border-yellow-900 hover:border-yellow-400">[ STRESS_TEST ]</button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Config Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Params Box */}
            <div className="border border-cyan-900 bg-cyan-900/5 p-5 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
              
              <h2 className="text-[10px] text-cyan-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Settings size={12} /> PARAM.CONFIG
              </h2>
              
              <div className="space-y-6 text-xs">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="uppercase text-cyan-600 flex items-center">
                      EWMA_ALPHA <InfoTooltip text="Weight of recent bursts" />
                    </span>
                    <span className="text-magenta-400">{alpha.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.1" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className="w-full accent-cyan-500 bg-cyan-900 h-1 appearance-none outline-none" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="uppercase text-cyan-600 flex items-center">
                      Q_PRESSURE_BETA <InfoTooltip text="Load scaling factor" />
                    </span>
                    <span className="text-magenta-400">{beta.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.1" value={beta} onChange={e => setBeta(parseFloat(e.target.value))} className="w-full accent-cyan-500 bg-cyan-900 h-1 appearance-none outline-none" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="uppercase text-cyan-600 flex items-center">
                      BASE_QUANTUM <InfoTooltip text="Standard RR Time Slice" />
                    </span>
                    <span className="text-cyan-100">{rrQuantum}</span>
                  </div>
                  <input type="range" min="1" max="15" step="1" value={rrQuantum} onChange={e => setRrQuantum(parseInt(e.target.value))} className="w-full accent-cyan-500 bg-cyan-900 h-1 appearance-none outline-none" />
                </div>
              </div>
            </div>

            {/* Queue Box */}
            <div className="border border-cyan-900 bg-cyan-900/5 p-5 relative flex flex-col h-[400px]">
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                  <Server size={12} /> THREAD_QUEUE
                </h2>
                <div className="flex gap-2">
                  <button onClick={randomizePriorities} className="text-[9px] uppercase tracking-widest text-yellow-500 hover:text-yellow-300 transition flex items-center gap-1" title="Randomize Priorities"><Shuffle size={10} /> PRIO</button>
                  <button onClick={() => setProcesses([])} className="text-[9px] uppercase tracking-widest text-magenta-500 hover:text-magenta-300 transition ml-2">PURGE</button>
                  <button onClick={addProcess} className="text-[9px] uppercase tracking-widest text-cyan-400 hover:text-cyan-200 transition">INJECT</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {processes.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-magenta-900 text-[10px] uppercase tracking-widest">
                      <ShieldAlert size={20} className="mb-2" />
                      QUEUE_EMPTY
                    </motion.div>
                  )}
                  {processes.map((p, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      key={i} 
                      className="border border-cyan-900/50 bg-black p-2 relative group flex justify-between items-center"
                    >
                      <button onClick={() => removeProcess(i)} className="absolute top-1 right-1 text-magenta-900 hover:text-magenta-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={10} /></button>
                      <div className="text-[10px] text-cyan-100 w-8">[{p.pid}]</div>
                      <div className="grid grid-cols-3 gap-2 w-full pl-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-cyan-700 uppercase">Arr</span>
                          <input type="number" min="0" value={p.arrival_time} onChange={(e) => updateProcess(i, 'arrival_time', parseInt(e.target.value) || 0)} className="w-full bg-transparent border-b border-cyan-900 text-cyan-300 outline-none text-xs text-center focus:border-cyan-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-cyan-700 uppercase">Brst</span>
                          <input type="number" min="1" value={p.burst_time} onChange={(e) => updateProcess(i, 'burst_time', parseInt(e.target.value) || 1)} className="w-full bg-transparent border-b border-cyan-900 text-cyan-300 outline-none text-xs text-center focus:border-cyan-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-magenta-700 uppercase">Prio</span>
                          <input type="number" min="1" value={p.priority} onChange={(e) => updateProcess(i, 'priority', parseInt(e.target.value) || 1)} className="w-full bg-transparent border-b border-magenta-900 text-magenta-300 outline-none text-xs text-center focus:border-magenta-400" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => executeSimulation(processes)}
                disabled={simulating || processes.length === 0}
                className="w-full bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-900 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 transition py-4 text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {simulating ? `COMPUTING [${scanProgress}%]` : '[ INITIALIZE_SIMULATION ]'}
              </button>
              
              {renderMetricsTable()}
              {renderTerminal()}
            </div>
          </div>

          {/* Right Panel: Radar & Data */}
          <div className="lg:col-span-8 space-y-6">
            
            {simulating ? (
              <div className="border border-cyan-900 h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,240,255,0.05)_2px,rgba(0,240,255,0.05)_4px)] pointer-events-none" />
                <Activity size={40} className="text-cyan-500 animate-pulse mb-4" />
                <div className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Analyzing Execution Matrix</div>
                <div className="w-64 h-1 bg-cyan-900 overflow-hidden">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#00F0FF]" style={{ width: `${scanProgress}%`, transition: 'width 0.1s linear' }} />
                </div>
                <div className="mt-4 text-[10px] text-cyan-700">
                  <DecodingText text="CALCULATING EWMA COEFFICIENTS... OPTIMIZING QUANTUMS..." />
                </div>
              </div>
            ) : results ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Radar HUD */}
                <div className="border border-cyan-900 bg-black p-5 h-80 flex flex-col relative">
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[10px] text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                      <Crosshair size={12} /> ALGORITHM_MATRIX
                    </h2>
                    <div className="flex gap-2">
                      <button onClick={() => setChartType(c => c === 'radar' ? 'bar' : 'radar')} className="text-[9px] uppercase tracking-widest text-cyan-400 hover:text-cyan-200 transition border border-cyan-900 px-2 py-1 flex items-center gap-1">
                        <BarChart3 size={10} /> TOGGLE_VIEW
                      </button>
                      <button onClick={copyMetrics} className="text-[9px] uppercase tracking-widest text-cyan-400 hover:text-cyan-200 transition border border-cyan-900 px-2 py-1 flex items-center gap-1">
                        <Copy size={10} /> COPY
                      </button>
                      <button onClick={exportToCSV} className="text-[9px] uppercase tracking-widest text-magenta-400 hover:text-magenta-200 transition border border-magenta-900 px-2 py-1 flex items-center gap-1">
                        <Download size={10} /> DUMP_DATA
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'radar' ? (
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { subject: 'WAIT', FCFS: results.fcfs.metrics.avg_waiting_time, RR: results.rr.metrics.avg_waiting_time, ARR: results.adaptive_rr.metrics.avg_waiting_time, SJF: results.sjf.metrics.avg_waiting_time, PRIO: results.priority.metrics.avg_waiting_time },
                          { subject: 'TURN', FCFS: results.fcfs.metrics.avg_turnaround_time, RR: results.rr.metrics.avg_turnaround_time, ARR: results.adaptive_rr.metrics.avg_turnaround_time, SJF: results.sjf.metrics.avg_turnaround_time, PRIO: results.priority.metrics.avg_turnaround_time },
                          { subject: 'RESP', FCFS: results.fcfs.metrics.avg_response_time, RR: results.rr.metrics.avg_response_time, ARR: results.adaptive_rr.metrics.avg_response_time, SJF: results.sjf.metrics.avg_response_time, PRIO: results.priority.metrics.avg_response_time },
                          { subject: 'CTX_SW', FCFS: results.fcfs.metrics.total_context_switches, RR: results.rr.metrics.total_context_switches, ARR: results.adaptive_rr.metrics.total_context_switches, SJF: results.sjf.metrics.total_context_switches, PRIO: results.priority.metrics.total_context_switches }
                        ]}>
                          <PolarGrid stroke="#00F0FF" strokeOpacity={0.1} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#00F0FF', fontSize: 10, letterSpacing: '2px' }} />
                          <PolarRadiusAxis tick={false} axisLine={false} />
                          <Radar name="FCFS" dataKey="FCFS" stroke="#3f3f46" fill="#3f3f46" fillOpacity={0.1} />
                          <Radar name="SJF" dataKey="SJF" stroke="#eab308" fill="#eab308" fillOpacity={0.1} />
                          <Radar name="PRIORITY" dataKey="PRIO" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                          <Radar name={`RR[${rrQuantum}]`} dataKey="RR" stroke="#00d6e6" fill="#00d6e6" fillOpacity={0.1} />
                          <Radar name="ARR_OPTI" dataKey="ARR" stroke="#FF0055" fill="#FF0055" fillOpacity={0.3} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #00F0FF', color: '#00F0FF' }} itemStyle={{ color: '#00F0FF' }} />
                        </RadarChart>
                      ) : (
                        <BarChart data={[
                          { name: 'FCFS', wait: results.fcfs.metrics.avg_waiting_time, turn: results.fcfs.metrics.avg_turnaround_time },
                          { name: 'SJF', wait: results.sjf.metrics.avg_waiting_time, turn: results.sjf.metrics.avg_turnaround_time },
                          { name: 'PRIO', wait: results.priority.metrics.avg_waiting_time, turn: results.priority.metrics.avg_turnaround_time },
                          { name: 'RR', wait: results.rr.metrics.avg_waiting_time, turn: results.rr.metrics.avg_turnaround_time },
                          { name: 'ARR', wait: results.adaptive_rr.metrics.avg_waiting_time, turn: results.adaptive_rr.metrics.avg_turnaround_time },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#00F0FF" strokeOpacity={0.1} />
                          <XAxis dataKey="name" stroke="#00F0FF" fontSize={10} />
                          <YAxis stroke="#00F0FF" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #00F0FF' }} />
                          <Legend />
                          <Bar dataKey="wait" name="Wait Time" fill="#00F0FF" />
                          <Bar dataKey="turn" name="Turnaround" fill="#FF0055" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Logs */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { title: 'ADAPTIVE_RR [OPTIMIZED]', data: results.adaptive_rr, border: 'border-magenta-500', titleColor: 'text-magenta-400' },
                    { title: 'SHORTEST_JOB_FIRST (SJF)', data: results.sjf, border: 'border-yellow-500', titleColor: 'text-yellow-400' },
                    { title: 'PRIORITY_SCHEDULING', data: results.priority, border: 'border-purple-500', titleColor: 'text-purple-400' },
                    { title: `BASE_RR [Q=${rrQuantum}]`, data: results.rr, border: 'border-cyan-900', titleColor: 'text-cyan-600' },
                    { title: 'FIRST_COME_FIRST_SERVE (FCFS)', data: results.fcfs, border: 'border-cyan-900', titleColor: 'text-cyan-600' }
                  ].map((algo, i) => (
                    <div key={i} className={`border-l-2 ${algo.border} bg-cyan-900/5 p-4`}>
                      <h3 className={`text-[10px] font-bold ${algo.titleColor} tracking-widest uppercase mb-3`}>{algo.title}</h3>
                      
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'WAIT_AVG', val: algo.data.metrics.avg_waiting_time.toFixed(2) },
                          { label: 'TURN_AVG', val: algo.data.metrics.avg_turnaround_time.toFixed(2) },
                          { label: 'RESP_AVG', val: algo.data.metrics.avg_response_time.toFixed(2) },
                          { label: 'SWTCH_TOT', val: algo.data.metrics.total_context_switches },
                        ].map((m, idx) => (
                          <div key={idx}>
                            <div className="text-[8px] text-cyan-800 uppercase tracking-widest">{m.label}</div>
                            <div className={`text-sm ${algo.titleColor} font-bold`}>{m.val}</div>
                          </div>
                        ))}
                      </div>

                      {renderLaserTimeline(algo.title, algo.data.gantt)}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="border border-cyan-900 border-dashed h-full min-h-[500px] flex flex-col items-center justify-center text-cyan-900/50">
                <Terminal size={48} className="mb-4" />
                <div className="text-xs uppercase tracking-widest">AWAITING_DATA_INPUT</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
