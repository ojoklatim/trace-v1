import { useState, useEffect } from 'react'
import axios from 'axios'
import { Cpu, ClipboardCheck, Construction, BookOpen, UserCheck, Loader2 } from 'lucide-react'
import './AIPanel.css'

function AIPanel({ selectedFeature }) {
  const [recommendation, setRecommendation] = useState(null)
  const [modelName, setModelName] = useState('AI Model')
  const [loading, setLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState('')

  const getAIRecommendation = async (feature) => {
    setLoading(true)
    setActionStatus('')
    try {
      const response = await axios.post('/api/recommendation', feature)
      setRecommendation(response.data.recommendation)
      setModelName(response.data.model || 'AI Model')
    } catch (e) {
      console.error("AI Error:", e)
      const serverMessage = e?.response?.data?.error
      setRecommendation(null)
      setActionStatus(serverMessage || 'AI insights are currently unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFeature) getAIRecommendation(selectedFeature)
  }, [selectedFeature])

  const handleCopySpec = async () => {
    if (!recommendation) return
    try {
      await navigator.clipboard.writeText(recommendation)
      setActionStatus('Recommendation copied to clipboard.')
    } catch {
      setActionStatus('Clipboard permission denied.')
    }
  }

  const handleCreateOrder = async () => {
    if (!recommendation || !selectedFeature) return
    try {
      const response = await axios.post('/api/work-orders', {
        recommendation,
        feature: selectedFeature,
      })
      const orderId = response?.data?.order?.id
      setActionStatus(orderId ? `Work order ${orderId} created.` : 'Work order created.')
    } catch (e) {
      setActionStatus(e?.response?.data?.error || 'Unable to create work order.')
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-header-bar">
        <span className="ai-model-badge">
          <div className="ai-dot"></div>
          {modelName}
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
            ) : !recommendation ? (
              <div className="ai-loading">
                <span>{actionStatus || 'No recommendation available for this cell.'}</span>
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
                  <button className="action-btn" onClick={handleCopySpec}>
                    <ClipboardCheck size={14} />
                    <span>Copy Spec</span>
                  </button>
                  <button className="action-btn btn-primary" onClick={handleCreateOrder}>
                    <Construction size={14} />
                    <span>Create Order</span>
                  </button>
                </div>
              </div>
            )}
            {actionStatus && !loading && <p className="empty-msg">{actionStatus}</p>}
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
