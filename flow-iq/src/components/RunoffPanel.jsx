import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, CloudRain, Gauge, Timer, Waves, Zap, ChevronDown } from 'lucide-react'
import { parseDEM, computeFlowDirections, computeFlowAccumulation, runSimulation, frameToGeoJSON } from '../utils/runoffEngine'
import demCsvRaw from '../data/dem.csv?raw'
import './RunoffPanel.css'

const PRESETS = [
  { label: 'Light Rain', icon: '🌦️', rainfall: 20, duration: 60, cn: 80, desc: '20 mm/hr · 1 hr' },
  { label: 'Moderate Storm', icon: '🌧️', rainfall: 50, duration: 120, cn: 85, desc: '50 mm/hr · 2 hr' },
  { label: 'Heavy Storm', icon: '⛈️', rainfall: 100, duration: 60, cn: 90, desc: '100 mm/hr · 1 hr' },
  { label: 'Extreme Event', icon: '🌊', rainfall: 150, duration: 180, cn: 92, desc: '150 mm/hr · 3 hr' },
]

function Hydrograph({ frames, currentFrame }) {
  if (!frames || frames.length < 2) return null
  const W = 260, H = 70, pad = { t: 6, r: 8, b: 18, l: 32 }
  const maxQ = Math.max(...frames.map(f => f.discharge), 0.001)
  const maxT = frames[frames.length - 1].time

  const x = (t) => pad.l + (t / maxT) * (W - pad.l - pad.r)
  const y = (d) => H - pad.b - (d / maxQ) * (H - pad.t - pad.b)

  const line = frames.map((f, i) => `${i === 0 ? 'M' : 'L'}${x(f.time).toFixed(1)},${y(f.discharge).toFixed(1)}`).join(' ')
  const area = line + ` L${x(maxT).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`

  const cf = frames[currentFrame] || frames[0]
  const cx = x(cf.time), cy = y(cf.discharge)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hydrograph-svg">
      <defs>
        <linearGradient id="hydro-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hydro-fill)" />
      <path d={line} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Current position */}
      <circle cx={cx} cy={cy} r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
      <line x1={cx} y1={y(0)} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      {/* Axes labels */}
      <text x={pad.l} y={H - 4} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)">0</text>
      <text x={W - pad.r} y={H - 4} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)" textAnchor="end">{maxT.toFixed(0)}m</text>
      <text x={pad.l - 4} y={pad.t + 4} fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono)" textAnchor="end">{maxQ.toFixed(1)}</text>
    </svg>
  )
}

function RunoffPanel({ onRunoffFrame, onSimulationState }) {
  const [rainfall, setRainfall] = useState(50)
  const [duration, setDuration] = useState(60)
  const [curveNumber, setCurveNumber] = useState(85)
  const [isRunning, setIsRunning] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [frames, setFrames] = useState(null)
  const [status, setStatus] = useState('idle') // idle | computing | ready | playing | paused
  const [showPresets, setShowPresets] = useState(false)

  const gridRef = useRef(null)
  const flowAccRef = useRef(null)
  const intervalRef = useRef(null)

  // Parse DEM and precompute flow accumulation once
  useEffect(() => {
    setTimeout(() => setStatus('computing'), 0)
    const timer = setTimeout(() => {
      const grid = parseDEM(demCsvRaw)
      const flowDir = computeFlowDirections(grid)
      const flowAcc = computeFlowAccumulation(grid, flowDir)
      gridRef.current = grid
      flowAccRef.current = flowAcc
      setStatus('idle')
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleRun = useCallback(() => {
    if (!gridRef.current || !flowAccRef.current) return
    setStatus('computing')

    setTimeout(() => {
      const result = runSimulation({
        grid: gridRef.current,
        flowAcc: flowAccRef.current,
        rainfallMmHr: rainfall,
        durationMin: duration,
        curveNumber: curveNumber,
        nFrames: 50,
      })
      setFrames(result)
      setCurrentFrame(0)
      setStatus('ready')
      onSimulationState?.(true)
      // Show first frame
      const geoJson = frameToGeoJSON(result[0], gridRef.current)
      onRunoffFrame?.(geoJson, result[0])
    }, 50)
  }, [rainfall, duration, curveNumber, onRunoffFrame, onSimulationState])

  const handlePlay = useCallback(() => {
    if (!frames) return
    setStatus('playing')
    setIsRunning(true)
  }, [frames])

  const handlePause = useCallback(() => {
    setStatus('paused')
    setIsRunning(false)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setCurrentFrame(0)
    setFrames(null)
    setStatus('idle')
    onRunoffFrame?.(null, null)
    onSimulationState?.(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [onRunoffFrame, onSimulationState])

  // Animation loop
  useEffect(() => {
    if (isRunning && frames) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          const next = prev + 1
          if (next >= frames.length) {
            setIsRunning(false)
            setStatus('paused')
            return prev
          }
          return next
        })
      }, 120)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, frames])

  // Emit current frame data to map
  useEffect(() => {
    if (frames && gridRef.current && currentFrame < frames.length) {
      const geoJson = frameToGeoJSON(frames[currentFrame], gridRef.current)
      onRunoffFrame?.(geoJson, frames[currentFrame])
    }
  }, [currentFrame, frames, onRunoffFrame])

  const applyPreset = (preset) => {
    setRainfall(preset.rainfall)
    setDuration(preset.duration)
    setCurveNumber(preset.cn)
    setShowPresets(false)
    handleReset()
  }

  const cf = frames?.[currentFrame]
  const progress = frames ? (currentFrame / (frames.length - 1)) * 100 : 0

  const cnLabel = curveNumber >= 90 ? 'Impervious' : curveNumber >= 80 ? 'Urban' : curveNumber >= 70 ? 'Mixed' : 'Permeable'

  return (
    <div className="runoff-panel">
      {/* Preset Selector */}
      <div className="runoff-presets">
        <button className="preset-trigger" onClick={() => setShowPresets(!showPresets)}>
          <CloudRain size={14} />
          <span>Storm Presets</span>
          <ChevronDown size={12} className={`preset-chevron ${showPresets ? 'open' : ''}`} />
        </button>
        {showPresets && (
          <div className="preset-dropdown animate-fade-in">
            {PRESETS.map((p, i) => (
              <button key={i} className="preset-item" onClick={() => applyPreset(p)}>
                <span className="preset-icon">{p.icon}</span>
                <div className="preset-info">
                  <span className="preset-name">{p.label}</span>
                  <span className="preset-desc">{p.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div className="runoff-params">
        <h4 className="section-title">Storm Parameters</h4>

        <div className="param-row">
          <div className="param-header">
            <CloudRain size={12} />
            <label>Rainfall Intensity</label>
            <span className="param-value">{rainfall} mm/hr</span>
          </div>
          <input type="range" min="10" max="200" step="5" value={rainfall}
            onChange={e => { setRainfall(+e.target.value); if (frames) handleReset() }}
            className="param-slider" />
          <div className="param-range"><span>10</span><span>200 mm/hr</span></div>
        </div>

        <div className="param-row">
          <div className="param-header">
            <Timer size={12} />
            <label>Storm Duration</label>
            <span className="param-value">{duration} min</span>
          </div>
          <input type="range" min="15" max="360" step="15" value={duration}
            onChange={e => { setDuration(+e.target.value); if (frames) handleReset() }}
            className="param-slider" />
          <div className="param-range"><span>15</span><span>360 min</span></div>
        </div>

        <div className="param-row">
          <div className="param-header">
            <Gauge size={12} />
            <label>Curve Number</label>
            <span className="param-value">{curveNumber} <small>({cnLabel})</small></span>
          </div>
          <input type="range" min="60" max="98" step="1" value={curveNumber}
            onChange={e => { setCurveNumber(+e.target.value); if (frames) handleReset() }}
            className="param-slider" />
          <div className="param-range"><span>60 Perm.</span><span>98 Imperv.</span></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="runoff-actions">
        {status === 'idle' && (
          <button className="sim-btn sim-btn--run" onClick={handleRun} disabled={status === 'computing'}>
            <Zap size={14} />
            <span>Run Simulation</span>
          </button>
        )}
        {status === 'computing' && (
          <button className="sim-btn sim-btn--computing" disabled>
            <div className="computing-spinner" />
            <span>Computing...</span>
          </button>
        )}
        {(status === 'ready' || status === 'paused') && (
          <div className="action-group">
            <button className="sim-btn sim-btn--play" onClick={handlePlay}>
              <Play size={14} />
              <span>Play</span>
            </button>
            <button className="sim-btn sim-btn--reset" onClick={handleReset}>
              <RotateCcw size={14} />
            </button>
          </div>
        )}
        {status === 'playing' && (
          <div className="action-group">
            <button className="sim-btn sim-btn--pause" onClick={handlePause}>
              <Pause size={14} />
              <span>Pause</span>
            </button>
            <button className="sim-btn sim-btn--reset" onClick={handleReset}>
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {frames && (
        <div className="runoff-timeline animate-fade-in">
          <div className="timeline-bar">
            <div className="timeline-progress" style={{ width: `${progress}%` }} />
            <input type="range" min="0" max={frames.length - 1} value={currentFrame}
              onChange={e => { setCurrentFrame(+e.target.value); if (isRunning) handlePause() }}
              className="timeline-slider" />
          </div>
          <div className="timeline-labels">
            <span>T = {cf?.time?.toFixed(0) || 0} min</span>
            <span>Frame {currentFrame + 1}/{frames.length}</span>
          </div>
        </div>
      )}

      {/* Live Stats */}
      {cf && (
        <div className="runoff-stats animate-fade-in">
          <h4 className="section-title">Live Diagnostics</h4>
          <div className="stats-grid">
            <div className="stat-card stat-card--rain">
              <CloudRain size={14} />
              <div className="stat-content">
                <span className="stat-label">Cumulative Rain</span>
                <span className="stat-num">{cf.cumulativeRainfall.toFixed(1)} <small>mm</small></span>
              </div>
            </div>
            <div className="stat-card stat-card--excess">
              <Waves size={14} />
              <div className="stat-content">
                <span className="stat-label">Excess Rainfall</span>
                <span className="stat-num">{cf.excessRainfall.toFixed(1)} <small>mm</small></span>
              </div>
            </div>
            <div className="stat-card stat-card--volume">
              <Gauge size={14} />
              <div className="stat-content">
                <span className="stat-label">Total Volume</span>
                <span className="stat-num">{(cf.totalVolumeM3 / 1000).toFixed(1)} <small>×10³m³</small></span>
              </div>
            </div>
            <div className="stat-card stat-card--peak">
              <Zap size={14} />
              <div className="stat-content">
                <span className="stat-label">Peak Depth</span>
                <span className="stat-num">{cf.maxDepth.toFixed(1)} <small>mm</small></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hydrograph */}
      {frames && (
        <div className="runoff-hydrograph animate-fade-in">
          <h4 className="section-title">Discharge Hydrograph</h4>
          <div className="hydrograph-container">
            <Hydrograph frames={frames} currentFrame={currentFrame} />
          </div>
          <div className="hydrograph-label">
            <span>Q = {cf?.discharge?.toFixed(2) || 0} m³/s</span>
          </div>
        </div>
      )}

      {/* Method Info */}
      {!frames && status === 'idle' && (
        <div className="runoff-info">
          <h4 className="section-title">Methodology</h4>
          <p>SCS Curve Number method with D8 flow routing on 30m Copernicus DEM grid (72×72 cells).</p>
          <div className="info-tags">
            <span className="info-tag">SCS-CN</span>
            <span className="info-tag">D8 Routing</span>
            <span className="info-tag">30m DEM</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RunoffPanel
