import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { Layers, AlertCircle, Droplets, Target, Shield, Square } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

import boundaryData from '../data/bwaise_boundary.geojson'
import drainsData from '../data/drains_osm.geojson'
import flowAccData from '../data/flow_accumulation.geojson'
import riskData from '../data/risk_zones.geojson'
import cvPointsData from '../data/drains_cv.geojson'

const CENTER = [0.34, 32.59]
const ZOOM = 12

const LAYER_CONFIG = [
  { id: 'boundary', label: 'Boundary', sublabel: 'Bwaise boundary extent', color: '#94a3b8', icon: Square },
  { id: 'drains', label: 'Infrastructure', sublabel: 'Existing OSM drains', color: '#0ea5e9', icon: Shield },
  { id: 'cvPoints', label: 'Field Evidence', sublabel: 'CV-detected drains', color: '#eab308', icon: Target },
  { id: 'flowAcc', label: 'Hydrology', sublabel: 'Flow accumulation', color: '#6366f1', icon: Droplets },
  { id: 'riskZones', label: 'Risk Analysis', sublabel: 'Critical flood zones', color: '#ef4444', icon: AlertCircle },
]

function LayerTogglePanel({ layers, toggleLayer }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`map-layer-panel ${collapsed ? 'map-layer-panel--collapsed' : ''}`}>
      <button className="layer-panel-toggle" onClick={() => setCollapsed(!collapsed)}>
        <Layers size={16} />
        {collapsed && <span className="layer-panel-count">{Object.values(layers).filter(Boolean).length}</span>}
      </button>

      {!collapsed && (
        <div className="layer-panel-body">
          <h3 className="layer-panel-title">Layers</h3>
          {LAYER_CONFIG.map((cfg) => (
            <button
              key={cfg.id}
              className={`layer-toggle-btn ${layers[cfg.id] ? 'layer-toggle-btn--on' : ''}`}
              onClick={() => toggleLayer(cfg.id)}
            >
              <div className="layer-indicator" style={{ '--lc': cfg.color, background: layers[cfg.id] ? cfg.color : 'transparent' }}>
                {layers[cfg.id] && <div className="indicator-dot" />}
              </div>
              <div className="layer-text">
                <span className="layer-main-label">{cfg.label}</span>
                <span className="layer-sub-label">{cfg.sublabel}</span>
              </div>
              <cfg.icon size={14} className="layer-icon-end" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Component to render animated runoff overlay
function RunoffLayer({ data }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }

    if (!data || !data.features || data.features.length === 0) return

    const layer = L.geoJSON(data, {
      style: (feature) => {
        const depth = feature.properties.water_depth || 0
        const maxDepth = 30
        const intensity = Math.min(depth / maxDepth, 1)
        const alpha = 0.15 + intensity * 0.65
        // Gradient: light cyan → deep blue
        const r = Math.round(10 + (1 - intensity) * 46)
        const g = Math.round(80 + (1 - intensity) * 120)
        const b = Math.round(200 + (1 - intensity) * 48)
        return {
          fillColor: `rgb(${r},${g},${b})`,
          fillOpacity: alpha,
          weight: 0,
          color: 'transparent',
        }
      },
    })

    layer.addTo(map)
    layerRef.current = layer

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [data, map])

  return null
}

// Runoff stats badge on the map
function RunoffBadge({ stats }) {
  if (!stats) return null
  return (
    <div className="runoff-map-badge">
      <div className="badge-dot" />
      <span>Runoff: {stats.excessRainfall?.toFixed(1)} mm excess · T={stats.time?.toFixed(0)} min</span>
    </div>
  )
}

function MapView({ layerVisibility, toggleLayer, onFeatureSelect, theme, runoffGeoJson, runoffStats }) {
  const basemapUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="mapview">
      <MapContainer center={CENTER} zoom={ZOOM} className="leaflet-map" zoomControl={false} attributionControl={false}>
        <TileLayer url={basemapUrl} />
        
        {/* GeoJSON layers remain same logic but with icon tooltips */}
        {layerVisibility.boundary && (
          <GeoJSON data={boundaryData} style={{ color: '#94a3b8', weight: 1, fillOpacity: 0, dashArray: '4 4' }} />
        )}
        
        {layerVisibility.flowAcc && (
          <GeoJSON 
            data={flowAccData} 
            style={f => ({ fillColor: '#6366f1', weight: 0, fillOpacity: Math.min((f.properties.flow_value || 0)/5000, 0.7) })} 
          />
        )}

        {layerVisibility.riskZones && (
          <GeoJSON 
            data={riskData} 
            style={f => {
              const s = f.properties.risk_score || 0;
              return { fillColor: s > 0.7 ? '#ef4444' : s > 0.4 ? '#f97316' : '#10b981', weight: 0.5, fillOpacity: 0.5, color: '#fff' };
            }}
            onEachFeature={(f, l) => {
              l.on('click', () => onFeatureSelect(f.properties));
            }}
          />
        )}

        {layerVisibility.drains && <GeoJSON data={drainsData} style={{ color: '#0ea5e9', weight: 2 }} />}
        
        {layerVisibility.cvPoints && (
          <GeoJSON 
            data={cvPointsData} 
            pointToLayer={(f, latlng) => L.circleMarker(latlng, { radius: 5, fillColor: '#eab308', color: '#a16207', weight: 1, fillOpacity: 0.9 })} 
          />
        )}

        {/* Runoff simulation overlay */}
        <RunoffLayer data={runoffGeoJson} />
      </MapContainer>
      <LayerTogglePanel layers={layerVisibility} toggleLayer={toggleLayer} />
      <RunoffBadge stats={runoffStats} />
    </div>
  )
}

export default MapView
