import { useMemo } from 'react'
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react'
import riskData from '../data/risk_zones.geojson'
import './RiskPanel.css'

function RiskPanel({ selectedFeature, isOfficial, lang }) {
  const stats = useMemo(() => {
    const features = riskData.features || []
    const props = features.map((f) => f.properties || {})
    const scores = props.map((p) => p.risk_score || 0)
    if (scores.length === 0) return null
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const high = scores.filter((s) => s >= 0.7).length
    const medium = scores.filter((s) => s >= 0.3 && s < 0.7).length
    const low = scores.filter((s) => s < 0.3).length
    const variance =
      scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length
    const confidence = Math.max(0.5, Math.min(0.99, 1 - Math.sqrt(variance)))
    const totalBoQ = props
      .filter((p) => (p.risk_score || 0) >= 0.7)
      .reduce((sum, p) => {
        const lengthMeters = Math.max(20, Math.min(120, Number(p.dist_drain || 50)))
        const diameterRate = (p.flow_acc || 0) > 100 ? 700000 : (p.flow_acc || 0) > 20 ? 450000 : 250000
        return sum + lengthMeters * diameterRate
      }, 0)
    const highPct = (high / scores.length) * 100
    const mediumPct = (medium / scores.length) * 100
    const lowPct = (low / scores.length) * 100
    const severity =
      highPct >= 30 ? 'Critical city pressure' : highPct >= 15 ? 'Elevated pressure' : 'Contained pressure'
    return { avg, max, min, high, medium, low, total: scores.length, totalBoQ, confidence, highPct, mediumPct, lowPct, severity }
  }, [])

  if (!stats) return <p className="empty-msg">No analysis data.</p>

  return (
    <div className="risk-panel">
      <div className="risk-cards">
        <div className="risk-card">
          <span className="risk-card-label">Priority Zones</span>
          <span className="risk-card-value">{stats.high} ({stats.highPct.toFixed(0)}%)</span>
          <TrendingUp size={14} className="card-icon icon--warn" />
        </div>
        <div className="risk-card">
          <span className="risk-card-label">Lower-Risk Zones</span>
          <span className="risk-card-value">{stats.low} ({stats.lowPct.toFixed(0)}%)</span>
          <TrendingDown size={14} className="card-icon icon--ok" />
        </div>
      </div>

      <div className="risk-stats">
        <h4 className="section-title">City Risk Summary</h4>
        <div className="stat-grid">
          <div className="stat-row">
            <span className="stat-key">Overall Status</span>
            <span className="stat-val">{stats.severity}</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Coverage Cells</span>
            <span className="stat-val">{stats.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Average Risk</span>
            <span className="stat-val">{(stats.avg * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">High-Risk Share</span>
            <span className="stat-val">{stats.highPct.toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Medium-Risk Share</span>
            <span className="stat-val">{stats.mediumPct.toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Model Stability</span>
            <span className="stat-val">{(stats.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {isOfficial && (
        <div className="risk-official-stats">
          <h4 className="section-title">{lang === 'en' ? 'Governance Insights' : 'Ebikwata ku Gavumenti'}</h4>
          <div className="boq-card">
            <span className="boq-label">{lang === 'en' ? 'Est. Recovery Cost' : 'Muwendo ogubalirira'}</span>
            <span className="boq-value">
              {stats.totalBoQ.toLocaleString()} <small>UGX</small>
            </span>
            <p className="boq-desc">Estimated from distance-to-drain and flow load across {stats.high} priority zones.</p>
          </div>
        </div>
      )}
      {selectedFeature && (
        <div className="risk-selected animate-fade-in">
          <h4 className="section-title">Selected Zone Details</h4>
          <div className="selection-card">
            <div className="selection-header">
              <MapPin size={14} />
              <span>Grid Cell</span>
            </div>
            <div className="stat-grid">
              <div className="stat-row">
                <span className="stat-key">Score</span>
                <span className="stat-val">{((selectedFeature.risk_score || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Elevation</span>
                <span className="stat-val">{selectedFeature.elevation?.toFixed(2)}m</span>
              </div>
              <div className="stat-row">
                <span className="stat-key">Distance to Drain</span>
                <span className="stat-val">{selectedFeature.dist_drain?.toFixed(1)}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="risk-distribution">
        <h4 className="section-title">Risk Mix (Low / Medium / High)</h4>
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
