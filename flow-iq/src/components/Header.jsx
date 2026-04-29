import { Sun, Moon, Box, Map as MapIcon, ShieldCheck, Activity } from 'lucide-react'
import './Header.css'

function Header({ theme, toggleTheme, is3D, toggle3D, lang, toggleLang, isOfficial, setIsOfficial }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-logo">
          <Activity size={20} className="logo-icon" />
        </div>
        <div className="brand-text">
          <h1>TRACE {isOfficial && <span className="admin-tag">PRO</span>}</h1>
          <span className="brand-tagline">Flood Risk Intelligence • Greater Kampala</span>
        </div>
      </div>

      <div className="header-status">
        <button 
          className={`status-pill ${isOfficial ? 'status--official' : ''}`} 
          onClick={() => setIsOfficial(!isOfficial)}
          title="Toggle Official/Public View"
        >
          <ShieldCheck size={14} className="status-icon" />
          <span>{isOfficial ? 'Official View' : 'Public View'}</span>
        </button>
        <button className="icon-btn" onClick={toggleLang} title="Switch Language">
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'en' ? 'EN' : 'LG'}</span>
        </button>
        <div className="status-pill status--live">
          <div className="live-dot"></div>
          <span>{lang === 'en' ? 'Live Data' : 'Data Embe'}</span>
        </div>
        <div className="status-pill status--risk-low">
          <span>{lang === 'en' ? 'Regional Risk: Low' : 'Obulabe: Bulowooza'}</span>
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
