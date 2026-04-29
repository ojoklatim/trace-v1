import { useState, useEffect, useCallback } from 'react'
import { CloudRain, RefreshCw, AlertTriangle, Radio, Wifi, WifiOff } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import './SensorPanel.css'

const API_BASE = '' // Use relative paths for Cloudflare Pages Functions

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="chart-tooltip-value">
          {p.name}: <strong>{p.value} mm</strong>
        </p>
      ))}
    </div>
  )
}

function SensorPanel() {
  const [sensors, setSensors] = useState([])
  const [alertActive, setAlertActive] = useState(false)
  const [isSpiking, setIsSpiking] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [realRain, setRealRain] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchSensors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sensors`)
      if (!res.ok) throw new Error('API unavailable')
      const data = await res.json()
      setSensors(data.sensors || [])
      setAlertActive(data.alert_active)
      setRealRain(data.real_rain_mm || 0)
      setIsOnline(true)
      setErrorMessage('')
    } catch (error) {
      setIsOnline(false)
      setSensors([])
      setAlertActive(false)
      setRealRain(0)
      setErrorMessage(error.message || 'Unable to retrieve live sensor data')
    }
  }, [])

  useEffect(() => {
    setTimeout(() => fetchSensors(), 0)
    const interval = setInterval(fetchSensors, 3000)
    return () => clearInterval(interval)
  }, [fetchSensors])

  const triggerRain = async () => {
    setIsSpiking(true)
    try {
      const res = await fetch(`${API_BASE}/api/trigger-rain`, { method: 'POST' })
      if (!res.ok) throw new Error('API unavailable')
    } catch {
      // Mock spike handled via isSpiking flag in fetchSensors
    }
  }

  const resetSensors = async () => {
    setIsSpiking(false)
    try {
      const res = await fetch(`${API_BASE}/api/reset-sensors`, { method: 'POST' })
      if (!res.ok) throw new Error('API unavailable')
      fetchSensors()
    } catch {
      setErrorMessage('Unable to reset simulation state')
    }
  }

  return (
    <div className="sensor-panel">
      {/* Connection status */}
      <div className={`connection-status ${isOnline ? 'status--online' : 'status--mock'}`}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>{isOnline ? 'Live Weather Sources Connected' : 'Live Weather Sources Unavailable'}</span>
      </div>

      {!isOnline && errorMessage && (
        <div className="chart-loading">
          <span>{errorMessage}</span>
        </div>
      )}

      {realRain > 0 && (
        <div className="real-rain-badge animate-bounce-slow">
          <CloudRain size={14} />
          <span>Real Rain: {realRain.toFixed(1)} mm/h</span>
        </div>
      )}

      <div className="sensor-controls">
        <button className={`control-btn ${isSpiking ? 'btn--active' : ''}`} onClick={triggerRain} disabled={isSpiking}>
          <CloudRain size={16} />
          <span>Simulate Storm</span>
        </button>
        <button className="control-btn" onClick={resetSensors}>
          <RefreshCw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {alertActive && (
        <div className="critical-banner animate-pulse">
          <AlertTriangle size={16} />
          <span>CRITICAL WATER LEVELS</span>
        </div>
      )}

      <div className="chart-card">
        <h4 className="section-title">Network Readings (mm)</h4>
        {sensors.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sensors} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8c8c88', fontSize: 9 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
              <YAxis tick={{ fill: '#8c8c88', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 650]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Level" radius={[3, 3, 0, 0]}>
                {sensors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.status === 'critical' ? '#ef4444' : entry.status === 'warning' ? '#f59e0b' : '#111110'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-loading">
            <div className="computing-spinner" />
            <span>Loading sensor data...</span>
          </div>
        )}
      </div>

      <div className="sensor-grid">
        {sensors.map(s => (
          <div key={s.id} className={`sensor-mini-card ${s.status === 'critical' ? 'mini--critical' : s.status === 'warning' ? 'mini--warning' : ''}`}>
            <div className="mini-meta">
              <Radio size={10} className="mini-icon" />
              <span className="mini-name">{s.name}</span>
            </div>
            <span className="mini-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SensorPanel
