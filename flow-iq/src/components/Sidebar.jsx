import { AlertTriangle, BarChart3, Bot, Settings2 } from 'lucide-react'
import RiskPanel from './RiskPanel'
import SensorPanel from './SensorPanel'
import AIPanel from './AIPanel'
import LayerControl from './LayerControl'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'risk', label: 'Risk Summary', icon: AlertTriangle },
  { id: 'sensors', label: 'Sensor Network', icon: BarChart3 },
  { id: 'ai', label: 'AI Insights', icon: Bot },
  { id: 'layers', label: 'Layer Settings', icon: Settings2 },
]

function Sidebar({ activePanel, setActivePanel, layerVisibility, toggleLayer, selectedFeature }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePanel === item.id ? 'nav-item--active' : ''}`}
            onClick={() => setActivePanel(item.id)}
            title={item.label}
          >
            <item.icon size={22} strokeWidth={activePanel === item.id ? 2.5 : 1.5} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-content">
        <header className="content-header">
          <h2>{NAV_ITEMS.find((n) => n.id === activePanel)?.label}</h2>
        </header>

        <div className="panel-container">
          {activePanel === 'risk' && <RiskPanel selectedFeature={selectedFeature} />}
          {activePanel === 'sensors' && <SensorPanel />}
          {activePanel === 'ai' && <AIPanel selectedFeature={selectedFeature} />}
          {activePanel === 'layers' && (
            <LayerControl layerVisibility={layerVisibility} toggleLayer={toggleLayer} />
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
