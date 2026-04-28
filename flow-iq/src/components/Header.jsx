import { Sun, Moon, Box, Map as MapIcon, ShieldCheck, Activity } from 'lucide-react'
import './Header.css'

function Header({ theme, toggleTheme, is3D, toggle3D }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-logo">
          <Activity size={20} className="logo-icon" />
        </div>
        <div className="brand-text">
          <h1>TRACE</h1>
          <span className="brand-tagline">Flood Risk Intelligence</span>
        </div>
      </div>

      <div className="header-status">
        <div className="status-pill">
          <ShieldCheck size={14} className="status-icon" />
          <span>Bwaise, Kampala</span>
        </div>
        <div className="status-pill status--live">
          <div className="live-dot"></div>
          <span>Live Data</span>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className={`header-btn ${is3D ? 'btn--active' : ''}`} 
          onClick={toggle3D}
          title={is3D ? "Switch to 2D" : "Switch to 3D"}
        >
          {is3D ? <MapIcon size={18} /> : <Box size={18} />}
          <span>{is3D ? '2D View' : '3D View'}</span>
        </button>

        <div className="divider"></div>

        <button className="header-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  )
}

export default Header
