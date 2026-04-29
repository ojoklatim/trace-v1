import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import Map, { Source, Layer, useControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import boundaryData from '../data/bwaise_boundary.geojson'
import drainsData from '../data/drains_osm.geojson'
import flowAccData from '../data/flow_accumulation.geojson'
import riskData from '../data/risk_zones.geojson'
import cvPointsData from '../data/drains_cv.geojson'

// Greater Kampala center
const INITIAL_VIEW_STATE = {
  latitude: 0.3476,
  longitude: 32.5825,
  zoom: 11.2,
  pitch: 45,
  bearing: 0
}

function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}

function MapView3D({ layerVisibility, onFeatureSelect, runoffGeoJson, runoffStats, reports, lowData, isOfficial }) {
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
    }),

    // Runoff simulation layer - extruded water depth
    runoffGeoJson && runoffGeoJson.features && runoffGeoJson.features.length > 0 && new GeoJsonLayer({
      id: 'runoff-3d',
      data: runoffGeoJson,
      extruded: true,
      getElevation: f => {
        const depth = f.properties.water_depth || 0
        return Math.max(depth * 0.8, 0.5) // Scale for visibility
      },
      getFillColor: f => {
        const depth = f.properties.water_depth || 0
        const maxDepth = 30
        const t = Math.min(depth / maxDepth, 1)
        // Light cyan to deep blue gradient
        return [
          Math.round(20 + (1 - t) * 36),
          Math.round(100 + (1 - t) * 89),
          Math.round(220 + (1 - t) * 28),
          Math.round(100 + t * 155)
        ]
      },
      getLineColor: [56, 189, 248, 60],
      getLineWidth: 0.5,
      lineWidthUnits: 'pixels',
      pickable: true,
      updateTriggers: {
        getElevation: [runoffStats?.time],
        getFillColor: [runoffStats?.time],
      },
      transitions: {
        getElevation: 100,
        getFillColor: 100,
      }
    }),

    // Community Reports (Pins)
    reports && reports.length > 0 && new ScatterplotLayer({
      id: 'community-reports-layer',
      data: reports.filter(d => d.location && typeof d.location.lng === 'number'),
      getPosition: d => [d.location.lng, d.location.lat],
      getFillColor: d => d.type === 'blockage' ? [239, 68, 68] : [249, 115, 22],
      getRadius: 15,
      radiusUnits: 'meters',
      pickable: true,
      onClick: info => {
        if (info.object) {
          alert(`Report: ${info.object.description}`);
        }
      }
    }),

    // Official Mode: Community Complaint Hotspots
    isOfficial && reports && reports.length > 0 && new HeatmapLayer({
      id: 'community-heatmap',
      data: reports.filter(d => d.location && typeof d.location.lng === 'number'),
      getPosition: d => [d.location.lng, d.location.lat],
      getWeight: 1,
      radiusPixels: 60,
      intensity: 1,
      threshold: 0.05
    }),
  ].filter(Boolean)

  return (
    <div className="mapview-3d" style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} 
        terrain={{ source: 'mapbox-dem', exaggeration: lowData ? 1.0 : 4.0 }}
      >
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        {!lowData && (
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
        )}
        <DeckGLOverlay layers={layers} interleaved={true} />
      </Map>
      
      <div className="map-3d-hint">
        Actual 3D DEM (Enhanced) • Use Right Click to Rotate • Scroll to Zoom
      </div>

      {/* Runoff stats overlay */}
      {runoffStats && (
        <div className="runoff-3d-badge">
          <div className="r3d-dot" />
          <span>Simulating · T={runoffStats.time?.toFixed(0)}min · {runoffStats.excessRainfall?.toFixed(1)}mm excess</span>
        </div>
      )}
    </div>
  )
}

export default MapView3D
