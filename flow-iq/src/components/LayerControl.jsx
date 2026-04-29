import { Shield, Droplets, AlertCircle, Target, Square } from 'lucide-react'
import './LayerControl.css'

const LAYERS = [
  { id: 'boundary', label: 'Kampala Coverage Boundary', color: '#94a3b8', icon: Square },
  { id: 'drains', label: 'OSM Infrastructure', color: '#0ea5e9', icon: Shield },
  { id: 'flowAcc', label: 'Hydrology Flow', color: '#6366f1', icon: Droplets },
  { id: 'riskZones', label: 'Critical Risk Zones', color: '#ef4444', icon: AlertCircle },
  { id: 'cvPoints', label: 'CV Evidence Points', color: '#eab308', icon: Target },
]

function LayerControl({ layerVisibility, toggleLayer, lowData, setLowData }) {
  return (
    <div className="layer-control">
      <p className="layer-desc">Select active data layers for spatial visualization.</p>
      <div className="layer-list">
        {LAYERS.map((layer) => (
          <label key={layer.id} className="layer-item">
            <div className="layer-toggle-wrap">
              <input
                type="checkbox"
                checked={layerVisibility[layer.id]}
                onChange={() => toggleLayer(layer.id)}
                className="layer-checkbox"
              />
              <div className={`layer-toggle ${layerVisibility[layer.id] ? 'layer-toggle--on' : ''}`}>
                <div className="layer-toggle-knob"></div>
              </div>
            </div>
            <div className="layer-meta">
              <layer.icon size={14} className="layer-icon" style={{ color: layer.color }} />
              <span className="layer-label">{layer.label}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="layer-footer">
        <div className="layer-item low-data-toggle">
          <div className="layer-meta">
            <span className="layer-label">Low Data Mode</span>
            <span className="layer-sub-label">Optimized for field network</span>
          </div>
          <div className="layer-toggle-wrap">
            <input
              type="checkbox"
              checked={lowData}
              onChange={() => setLowData(!lowData)}
              className="layer-checkbox"
            />
            <div className={`layer-toggle ${lowData ? 'layer-toggle--on' : ''}`}>
              <div className="layer-toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerControl
