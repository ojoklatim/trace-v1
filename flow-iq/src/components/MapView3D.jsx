import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer } from '@deck.gl/layers'
import Map, { Source } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import boundaryData from '../data/bwaise_boundary.geojson'
import drainsData from '../data/drains_osm.geojson'
import flowAccData from '../data/flow_accumulation.geojson'
import riskData from '../data/risk_zones.geojson'
import cvPointsData from '../data/drains_cv.geojson'
import demData from '../data/dem_grid.geojson'

// Bwaise centre
const INITIAL_VIEW_STATE = {
  latitude: 0.34,
  longitude: 32.59,
  zoom: 12.5,
  pitch: 60,
  bearing: -15
}

function MapView3D({ layerVisibility, onFeatureSelect }) {
  const layers = [
    // Boundary (Floor)
    new GeoJsonLayer({
      id: 'boundary-3d',
      data: boundaryData,
      getFillColor: [15, 23, 42, 50],
      getLineColor: [100, 116, 139, 200],
      getLineWidth: 2,
      lineWidthUnits: 'pixels'
    }),

    // Drains (Blue lines on floor)
    layerVisibility.drains && new GeoJsonLayer({
      id: 'drains-3d',
      data: drainsData,
      getLineColor: [56, 189, 248, 255],
      getLineWidth: 3,
      lineWidthUnits: 'pixels'
    }),

    // CV Detections (Yellow pins)
    layerVisibility.cvPoints && new GeoJsonLayer({
      id: 'cv-3d',
      data: cvPointsData,
      getFillColor: [250, 204, 21, 255],
      getPointRadius: 15,
      pointRadiusUnits: 'meters'
    }),

    // Flow Accumulation (Blue extruded blocks)
    layerVisibility.flowAcc && new GeoJsonLayer({
      id: 'flow-3d',
      data: flowAccData,
      getFillColor: f => {
        const v = f.properties.flow_value || 0
        const intensity = Math.min(v / 5000, 1)
        return [30, 58, 138, 50 + intensity * 200]
      },
      extruded: true,
      getElevation: f => (f.properties.flow_value || 0) / 20,
      pickable: true
    }),

    // High-Res Elevation Surface (3D DEM)
    new GeoJsonLayer({
      id: 'dem-3d',
      data: demData,
      pickable: false,
      extruded: true,
      getElevation: f => Math.max(0, (f.properties.elevation || 1160) - 1160) * 10,
      getFillColor: f => {
        const e = f.properties.elevation || 1160
        // Elevation gradient: Green (low) to Brown (high)
        if (e > 1200) return [100, 90, 80, 255]
        if (e > 1180) return [140, 130, 110, 255]
        if (e > 1170) return [34, 197, 94, 255]
        return [22, 163, 74, 255]
      }
    }),

    // Risk Zones (Draped over the high-res DEM)
    layerVisibility.riskZones && new GeoJsonLayer({
      id: 'risk-3d',
      data: riskData,
      pickable: true,
      extruded: true,
      getElevation: f => (Math.max(0, (f.properties.elevation || 1160) - 1160) * 10) + 1, // Just above DEM
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
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={({object}) => object && (object.properties.risk_score ? `Risk: ${object.properties.risk_score.toFixed(2)}` : null)}
      >
        <Map
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} 
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        >
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
        </Map>
      </DeckGL>
      
      <div className="map-3d-hint">
        Use Right Click to Rotate • Scroll to Zoom
      </div>
    </div>
  )
}

export default MapView3D
