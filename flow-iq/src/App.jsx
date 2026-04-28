import { useState, useEffect } from 'react'
import { Sun, Moon, Box, Map as MapIcon } from 'lucide-react'
import MapView from './components/MapView'
import MapView3D from './components/MapView3D'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import './App.css'

function App() {
  const [activePanel, setActivePanel] = useState('risk')
  const [theme, setTheme] = useState('light')
  const [is3D, setIs3D] = useState(false)
  const [layerVisibility, setLayerVisibility] = useState({
    boundary: true,
    drains: true,
    flowAcc: true,
    riskZones: true,
    cvPoints: true,
  })
  const [selectedFeature, setSelectedFeature] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  const toggle3D = () => setIs3D(prev => !prev)

  const toggleLayer = (layer) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature)
    setActivePanel('ai')
  }

  return (
    <div className="app">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        is3D={is3D} 
        toggle3D={toggle3D} 
      />
      <div className="app-body">
        <Sidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          layerVisibility={layerVisibility}
          toggleLayer={toggleLayer}
          selectedFeature={selectedFeature}
        />
        <main className="map-container">
          {is3D ? (
            <MapView3D 
              layerVisibility={layerVisibility}
              onFeatureSelect={handleFeatureSelect}
            />
          ) : (
            <MapView
              layerVisibility={layerVisibility}
              toggleLayer={toggleLayer}
              onFeatureSelect={handleFeatureSelect}
              theme={theme}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
