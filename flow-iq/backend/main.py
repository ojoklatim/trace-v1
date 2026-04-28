import os
import json
import asyncio
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FLOW-IQ API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ──
class SensorNode:
    def __init__(self, id: int, lat: float, lon: float, name: str):
        self.id = id
        self.lat = lat
        self.lon = lon
        self.name = name
        self.value = 150.0  # mm base
        self.status = "nominal"

# Kampala BBOX: WEST 32.52, SOUTH 0.26, EAST 32.66, NORTH 0.42
sensors = [
    SensorNode(i, 
               np.random.uniform(0.26, 0.42), 
               np.random.uniform(32.52, 32.66), 
               f"KLA-NODE-{str(i).zfill(2)}")
    for i in range(1, 21) # Increased count for larger area
]

rainfall_spiked = False
alert_threshold = 450.0

async def sensor_simulator():
    global rainfall_spiked
    while True:
        for s in sensors:
            noise = np.random.normal(0, 5)
            if rainfall_spiked:
                s.value = min(600, s.value + np.random.uniform(20, 50))
            else:
                s.value = max(120, min(200, s.value + noise))
            
            s.status = "critical" if s.value > alert_threshold else "nominal"
        
        await asyncio.sleep(3)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(sensor_simulator())

# ── Endpoints ──

@app.get("/api/sensors")
async def get_sensors():
    return {
        "timestamp": datetime.now().isoformat(),
        "sensors": [
            {"id": s.id, "name": s.name, "lat": s.lat, "lon": s.lon, "value": round(s.value, 1), "status": s.status}
            for s in sensors
        ],
        "alert_active": any(s.status == "critical" for s in sensors)
    }

@app.post("/api/trigger-rain")
async def trigger_rain():
    global rainfall_spiked
    rainfall_spiked = True
    return {"message": "Heavy rainfall event triggered", "status": "active"}

@app.post("/api/reset-sensors")
async def reset_sensors():
    global rainfall_spiked
    rainfall_spiked = False
    for s in sensors:
        s.value = 150.0
        s.status = "nominal"
    return {"message": "Sensors reset to baseline"}

# Load GeoJSONs (assuming they are in ../outputs)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "outputs")

@app.get("/api/layers/{name}")
async def get_layer(name: str):
    mapping = {
        "boundary": "bwaise_boundary.geojson",
        "drains": "drains_osm.geojson",
        "flow_accumulation": "flow_accumulation.geojson",
        "risk_zones": "risk_zones.geojson",
        "cv_points": "drains_cv.geojson"
    }
    if name not in mapping: raise HTTPException(404)
    path = os.path.join(DATA_DIR, mapping[name])
    with open(path, "r") as f: return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
