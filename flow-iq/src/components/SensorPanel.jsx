import { useState, useEffect, useRef, useCallback } from 'react'
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

// Mock sensor data for local development
const MOCK_SENSORS = [
  { id: 1, name: 'Bwaise-N1', value: 120, status: 'normal' },
  { id: 2, name: 'Bwaise-N2', value: 245, status: 'normal' },
  { id: 3, name: 'Kawaala-W', value: 89, status: 'normal' },
  { id: 4, name: 'Mulago-S', value: 310, status: 'normal' },
  { id: 5, name: 'Makerere-E', value: 175, status: 'normal' },
  { id: 6, name: 'Wandegeya', value: 420, status: 'warning' },
  { id: 7, name: 'Katanga-C', value: 67, status: 'normal' },
  { id: 8, name: 'Kivulu-D', value: 198, status: 'normal' },
]

function generateVariation(baseSensors, spiking = false) {
  return baseSensors.map(s => {
    const jitter = (Math.random() - 0.5) * 40
    let value = Math.max(10, Math.round(s.value + jitter))
    if (spiking) {
      value = Math.min(650, Math.round(value + Math.random() * 300))
    }
    const status = value > 500 ? 'critical' : value > 350 ? 'warning' : 'normal'
    return { ...s, value, status }
  })
}

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
  const baseRef = useRef(MOCK_SENSORS)

  const fetchSensors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sensors`)
      if (!res.ok) throw new Error('API unavailable')
      const data = await res.json()
      setSensors(data.sensors)
      setAlertActive(data.alert_active)
      setIsOnline(true)
    } catch {
      // Fallback to mock data with realistic variation
      setIsOnline(false)
      const mock = generateVariation(baseRef.current, isSpiking)
      setSensors(mock)
      setAlertActive(mock.some(s => s.status === 'critical'))
    }
  }, [isSpiking])

  useEffect(() => {
    fetchSensors()
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
    baseRef.current = MOCK_SENSORS
    try {
      const res = await fetch(`${API_BASE}/api/reset-sensors`, { method: 'POST' })
      if (!res.ok) throw new Error('API unavailable')
    } catch {
      setSensors(generateVariation(MOCK_SENSORS))
      setAlertActive(false)
    }
  }

  return (
    <div className="sensor-panel">
      {/* Connection status */}
      <div className={`connection-status ${isOnline ? 'status--online' : 'status--mock'}`}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>{isOnline ? 'Live API Connected' : 'Local Simulation Mode'}</span>
      </div>

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
