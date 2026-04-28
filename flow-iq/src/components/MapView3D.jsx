import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer } from '@deck.gl/layers'
import Map, { Source, Layer, useControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import boundaryData from '../data/bwaise_boundary.geojson'
import drainsData from '../data/drains_osm.geojson'
import flowAccData from '../data/flow_accumulation.geojson'
import riskData from '../data/risk_zones.geojson'
import cvPointsData from '../data/drains_cv.geojson'

// Bwaise centre
const INITIAL_VIEW_STATE = {
  latitude: 0.34,
  longitude: 32.59,
  zoom: 14.5,
  pitch: 60,
  bearing: -15
}

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}

function MapView3D({ layerVisibility, onFeatureSelect }) {
  const layers = [
    // Boundary Outline
    layerVisibility.boundary && new GeoJsonLayer({
      id: 'boundary-3d',
      data: boundaryData,
      getFillColor: [15, 23, 42, 0],
      getLineColor: [255, 255, 255, 100],
      getLineWidth: 2,
      lineWidthUnits: 'pixels'
    }),

    // Drains
    layerVisibility.drains && new GeoJsonLayer({
      id: 'drains-3d',
      data: drainsData,
      getLineColor: [56, 189, 248, 255],
      getLineWidth: 3,
      lineWidthUnits: 'pixels'
    }),

    // CV Detections (Pins)
    layerVisibility.cvPoints && new GeoJsonLayer({
      id: 'cv-3d',
      data: cvPointsData,
      getFillColor: [250, 204, 21, 255],
      getPointRadius: 8,
      pointRadiusUnits: 'pixels',
      pickable: true
    }),

    // Flow Accumulation
    layerVisibility.flowAcc && new GeoJsonLayer({
      id: 'flow-3d',
      data: flowAccData,
      getFillColor: f => {
        const v = f.properties.flow_value || 0
        const intensity = Math.min(v / 5000, 1)
        return [30, 58, 138, 100 + intensity * 155]
      },
      extruded: true,
      getElevation: f => (f.properties.flow_value || 0) / 10,
      pickable: true
    }),

    // Risk Zones
    layerVisibility.riskZones && new GeoJsonLayer({
      id: 'risk-3d',
      data: riskData,
      pickable: true,
      getFillColor: f => {
        const s = f.properties.risk_score || 0
        if (s >= 0.7) return [239, 68, 68, 180]
        if (s >= 0.5) return [249, 115, 22, 160]
        if (s >= 0.3) return [251, 191, 36, 140]
        return [52, 211, 153, 0]
      },
      onClick: info => {
        if (info.object) onFeatureSelect(info.object.properties)
      }
    })
  ].filter(Boolean)

  return (
    <div className="mapview-3d" style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} 
        terrain={{ source: 'mapbox-dem', exaggeration: 4.0 }}
      >
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        <Layer
          id="3d-buildings"
          source="composite"
          source-layer="building"
          filter={['==', 'extrude', 'true']}
          type="fill-extrusion"
          minzoom={15}
          paint={{
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }}
        />
        <DeckGLOverlay layers={layers} interleaved={true} />
      </Map>
      
      <div className="map-3d-hint">
        Actual 3D DEM (Enhanced) • Use Right Click to Rotate • Scroll to Zoom
      </div>
    </div>
  )
}

export default MapView3D

