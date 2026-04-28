import { useState, useEffect } from 'react'
import axios from 'axios'
import { CloudRain, RefreshCw, AlertTriangle, Radio } from 'lucide-react'
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

  const fetchSensors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/sensors`)
      setSensors(res.data.sensors)
      setAlertActive(res.data.alert_active)
    } catch (e) {
      console.error('Failed to fetch sensors', e)
    }
  }

  useEffect(() => {
    fetchSensors()
    const interval = setInterval(fetchSensors, 3000)
    return () => clearInterval(interval)
  }, [])

  const triggerRain = async () => {
    setIsSpiking(true)
    await axios.post(`${API_BASE}/api/trigger-rain`)
  }

  const resetSensors = async () => {
    setIsSpiking(false)
    await axios.post(`${API_BASE}/api/reset-sensors`)
  }

  return (
    <div className="sensor-panel">
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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sensors} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#8c8c88', fontSize: 9 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
            <YAxis tick={{ fill: '#8c8c88', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 650]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Level">
              {sensors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.status === 'critical' ? '#ef4444' : '#111110'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sensor-grid">
        {sensors.map(s => (
          <div key={s.id} className={`sensor-mini-card ${s.status === 'critical' ? 'mini--critical' : ''}`}>
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
