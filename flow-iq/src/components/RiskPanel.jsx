import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity, Info, MapPin } from 'lucide-react'
import riskData from '../data/risk_zones.geojson'
import './RiskPanel.css'

function RiskPanel({ selectedFeature }) {
  const stats = useMemo(() => {
    const features = riskData.features || []
    const scores = features.map((f) => f.properties.risk_score || 0)
    if (scores.length === 0) return null
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const high = scores.filter((s) => s >= 0.7).length
    const medium = scores.filter((s) => s >= 0.3 && s < 0.7).length
    const low = scores.filter((s) => s < 0.3).length
    return { avg, max, min, high, medium, low, total: scores.length }
  }, [])

  if (!stats) return <p className="empty-msg">No analysis data.</p>

  return (
    <div className="risk-panel">
      <div className="risk-cards">
        <div className="risk-card">
          <span className="risk-card-label">High Risk</span>
          <span className="risk-card-value">{stats.high}</span>
          <TrendingUp size={14} className="card-icon icon--warn" />
        </div>
        <div className="risk-card">
          <span className="risk-card-label">Baseline</span>
          <span className="risk-card-value">{stats.low}</span>
          <TrendingDown size={14} className="card-icon icon--ok" />
        </div>
      </div>

      <div className="risk-stats">
        <h4 className="section-title">Model Diagnostics</h4>
        <div className="stat-grid">
          <div className="stat-row">
            <span className="stat-key">Mean Score</span>
            <span className="stat-val">{stats.avg.toFixed(4)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Confidence</span>
            <span className="stat-val">0.82 AUC</span>
          </div>
        </div>
      </div>

      {selectedFeature && (
        <div className="risk-selected animate-fade-in">
          <h4 className="section-title">Selection Metadata</h4>
          <div className="selection-card">
            <div className="selection-header">
              <MapPin size={14} />
              <span>Cell Reference</span>
            </div>
            <div className="stat-grid">
              <div className="stat-row">
                <span className="stat-key">Score</span>
                <span className="stat-val">{selectedFeature.risk_score?.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Elevation</span>
                <span className="stat-val">{selectedFeature.elevation?.toFixed(2)}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="risk-distribution">
        <h4 className="section-title">Score Distribution</h4>
        <div className="dist-bar">
          <div className="dist-segment dist-segment--low" style={{ flex: stats.low }}></div>
          <div className="dist-segment dist-segment--mid" style={{ flex: stats.medium }}></div>
          <div className="dist-segment dist-segment--high" style={{ flex: stats.high }}></div>
        </div>
      </div>
    </div>
  )
}

export default RiskPanel
