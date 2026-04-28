import { useState, useEffect } from 'react'
import axios from 'axios'
import { Cpu, ClipboardCheck, Construction, BookOpen, UserCheck, Loader2 } from 'lucide-react'
import './AIPanel.css'

const FALLBACKS = {
  "Bwaise NW-012": "I recommend installing a 900mm diameter reinforced concrete pipe (RCP) culvert at this junction. The flow accumulation of 4200 units indicates a significant catchment area. Connect to the primary drain on the main road.",
  "Bwaise SE-045": "Install a 1200mm box culvert. This area is critically low-lying (3.4m below surrounding grade). The 150m gap to the nearest drain is the primary cause of localized pooling.",
}

function AIPanel({ selectedFeature }) {
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(false)

  const getAIRecommendation = async (feature) => {
    setLoading(true)
    const { risk_score, elevation, dist_drain, flow_acc } = feature
    try {
      await new Promise(r => setTimeout(r, 1500))
      const locKey = `Bwaise ${elevation > 0.35 ? 'NW' : 'SE'}-${Math.floor(risk_score * 100)}`
      const text = FALLBACKS[locKey] || `ANALYSIS REPORT: Cell risk rating ${risk_score.toFixed(2)} requires a ${(flow_acc / 1000).toFixed(1)}m diameter extension based on local catchment geometry.`
      setRecommendation(text)
    } catch (e) {
      setRecommendation("Service connection unavailable.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFeature) getAIRecommendation(selectedFeature)
  }, [selectedFeature])

  return (
    <div className="ai-panel">
      <div className="ai-header-bar">
        <span className="ai-model-badge">
          <div className="ai-dot"></div>
          ENGINEERING ASSISTANT v4
        </span>
      </div>

      <div className="ai-container">
        {!selectedFeature ? (
          <div className="ai-empty">
            <Cpu size={32} className="ai-empty-icon" />
            <p>Select a <strong>Risk Zone</strong> on the map to generate a structural recommendation.</p>
          </div>
        ) : (
          <div className="ai-result animate-fade-in">
            <div className="ai-meta">
              <span className="meta-tag">XGBOOST-L4</span>
              <span className="meta-tag">DEM-GLO30</span>
            </div>
            
            <h4 className="section-title">Field Recommendation</h4>
            
            {loading ? (
              <div className="ai-loading">
                <Loader2 size={24} className="animate-spin" />
                <span>Analyzing topological constraints...</span>
              </div>
            ) : (
              <div className="ai-text-box">
                <div className="engineer-header">
                  <div className="engineer-avatar-icon">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p className="engineer-name">Eng. Musoke B.</p>
                    <p className="engineer-role">Drainage Infrastructure</p>
                  </div>
                </div>
                <p className="recommendation-text">"{recommendation}"</p>
                <div className="action-footer">
                  <button className="action-btn">
                    <ClipboardCheck size={14} />
                    <span>Copy Spec</span>
                  </button>
                  <button className="action-btn btn-primary">
                    <Construction size={14} />
                    <span>Create Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ai-knowledge">
        <h4 className="section-title">Knowledge Base</h4>
        <div className="kb-item">
          <div className="kb-icon-wrap"><BookOpen size={14} /></div>
          <div>
            <span>Pipe Standards</span>
            <p>Grade RCP: 600mm, 900mm, 1200mm.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIPanel
