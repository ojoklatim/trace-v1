import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import MapView3D from './components/MapView3D'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import WarningBanner from './components/WarningBanner'
import './App.css'

function App() {
  const [activePanel, setActivePanel] = useState('risk')
  const [theme, setTheme] = useState('light')
  const [lang, setLang] = useState('en') // 'en' or 'lg'
  const [lowData, setLowData] = useState(false)
  const [isOfficial, setIsOfficial] = useState(false)
  const [is3D, setIs3D] = useState(false)
  const [layerVisibility, setLayerVisibility] = useState({
    boundary: true,
    drains: true,
    flowAcc: true,
    riskZones: true,
    cvPoints: true,
  })
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [runoffGeoJson, setRunoffGeoJson] = useState(null)
  const [runoffStats, setRunoffStats] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [reports, setReports] = useState([])
  const [rainIntensity, setRainIntensity] = useState(0)

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (err) {
      console.error('Failed to fetch reports')
    }
  }, [])

  const fetchSensorData = useCallback(async () => {
    try {
      const res = await fetch('/api/sensors')
      if (res.ok) {
        const data = await res.json()
        setRainIntensity(data.real_rain_mm || 0)
      }
    } catch (err) {
      console.error('Failed to fetch rainfall data')
    }
  }, [])

  useEffect(() => {
    fetchReports()
    fetchSensorData()
    const interval = setInterval(() => {
      fetchReports()
      fetchSensorData()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchReports, fetchSensorData])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  const toggle3D = () => setIs3D(prev => !prev)
  const toggleLang = () => setLang(prev => prev === 'en' ? 'lg' : 'en')

  const toggleLayer = (layer) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature)
    setActivePanel('ai')
  }

  const handleRunoffFrame = useCallback((geoJson, stats) => {
    setRunoffGeoJson(geoJson)
    setRunoffStats(stats)
  }, [])

  const handleSimulationState = useCallback((active) => {
    setIsSimulating(active)
  }, [])

  return (
    <div className="app">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        is3D={is3D} 
        toggle3D={toggle3D} 
        lang={lang}
        toggleLang={toggleLang}
        isOfficial={isOfficial}
        setIsOfficial={setIsOfficial}
      />
      <WarningBanner rainIntensity={rainIntensity} lang={lang} />
      <div className="app-body">
        <Sidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          layerVisibility={layerVisibility}
          toggleLayer={toggleLayer}
          selectedFeature={selectedFeature}
          onRunoffFrame={handleRunoffFrame}
          onSimulationState={handleSimulationState}
          lang={lang}
          lowData={lowData}
          setLowData={setLowData}
          isOfficial={isOfficial}
        />
        <main className="map-container">
          {is3D ? (
            <MapView3D 
              layerVisibility={layerVisibility}
              onFeatureSelect={handleFeatureSelect}
              runoffGeoJson={runoffGeoJson}
              runoffStats={runoffStats}
              reports={reports}
              lowData={lowData}
              isOfficial={isOfficial}
            />
          ) : (
            <MapView
              layerVisibility={layerVisibility}
              toggleLayer={toggleLayer}
              onFeatureSelect={handleFeatureSelect}
              theme={theme}
              runoffGeoJson={runoffGeoJson}
              runoffStats={runoffStats}
              reports={reports}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
