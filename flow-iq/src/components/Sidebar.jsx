import { AlertTriangle, BarChart3, Bot, Settings2, CloudRain, Users } from 'lucide-react'
import RiskPanel from './RiskPanel'
import SensorPanel from './SensorPanel'
import AIPanel from './AIPanel'
import LayerControl from './LayerControl'
import RunoffPanel from './RunoffPanel'
import CommunityPanel from './CommunityPanel'
import './Sidebar.css'

const getNavItems = (lang) => [
  { id: 'risk', label: lang === 'en' ? 'Risk Summary' : 'Ebikwata ku Bulabe', icon: AlertTriangle },
  { id: 'sensors', label: lang === 'en' ? 'Sensor Network' : 'Ebyuma ebipima', icon: BarChart3 },
  { id: 'simulation', label: lang === 'en' ? 'Simulation' : 'Okugezesa enkuba', icon: CloudRain },
  { id: 'community', label: lang === 'en' ? 'Community' : 'Abantu bakawefube', icon: Users },
  { id: 'ai', label: lang === 'en' ? 'AI Insights' : 'Amagezi ga AI', icon: Bot },
  { id: 'layers', label: lang === 'en' ? 'Layer Settings' : 'Entegeka ya Map', icon: Settings2 },
]

function Sidebar({ activePanel, setActivePanel, layerVisibility, toggleLayer, selectedFeature, onRunoffFrame, onSimulationState, lang, lowData, setLowData, isOfficial }) {
  const navItems = getNavItems(lang)
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => (
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
          <h2>{navItems.find((n) => n.id === activePanel)?.label}</h2>
        </header>

        <div className="panel-container">
          {activePanel === 'risk' && (
            <RiskPanel 
              selectedFeature={selectedFeature} 
              isOfficial={isOfficial} 
              lang={lang} 
            />
          )}
          {activePanel === 'sensors' && <SensorPanel />}
          {activePanel === 'simulation' && (
            <RunoffPanel 
              onRunoffFrame={onRunoffFrame} 
              onSimulationState={onSimulationState} 
            />
          )}
          {activePanel === 'community' && <CommunityPanel />}
          {activePanel === 'ai' && <AIPanel selectedFeature={selectedFeature} />}
          {activePanel === 'layers' && (
            <LayerControl 
              layerVisibility={layerVisibility} 
              toggleLayer={toggleLayer} 
              lowData={lowData}
              setLowData={setLowData}
            />
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
