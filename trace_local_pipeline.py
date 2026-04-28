import os
import requests
import numpy as np
import pandas as pd
import geopandas as gpd
import rasterio
import osmnx as ox
import xgboost as xgb
from shapely.geometry import shape, mapping, box, Point, MultiPolygon
from rasterio.features import shapes
import whitebox
import matplotlib.pyplot as plt

# 1. Setup Local Environment
OUTPUT_DIR = './outputs'
os.makedirs(OUTPUT_DIR, exist_ok=True)

wbt = whitebox.WhiteboxTools()
wbt.set_working_dir(os.getcwd())

# Kampala Bounding Box
WEST, SOUTH, EAST, NORTH = 32.52, 0.26, 32.66, 0.42
print(f"--- TRACE LOCAL PIPELINE START ---")
print(f"Area: Kampala Capital [{WEST}, {SOUTH}, {EAST}, {NORTH}]")

# 2. OpenTopography GLO-30 Download
print("\n[1/6] Downloading GLO-30 DEM from OpenTopography...")
url = f"https://portal.opentopography.org/API/globaldem?demtype=COP30&west={WEST}&south={SOUTH}&east={EAST}&north={NORTH}&outputFormat=GTiff"
response = requests.get(url)

if response.status_code == 200:
    with open("glo30_raw.tif", "wb") as f:
        f.write(response.content)
    print("DONE: GLO-30 downloaded successfully.")
else:
    print(f"ERROR: Download failed (Status {response.status_code}). URL: {url}")
    if response.status_code == 400:
        print("Reason: Bad Request. Check bounding box limits.")
    elif response.status_code == 401:
        print("Reason: Unauthorized. API key might be required for this area or size.")
    # Check if file already exists
    if not os.path.exists("glo30_raw.tif"):
        exit(1)

# 3. FABDEM Building Correction
print("\n[2/6] Running building/vegetation correction (FABDEM logic)...")
wbt.remove_off_terrain_objects("glo30_raw.tif", "conditioned_dem.tif", filter=11, slope=15.0)
print("DONE: Correction complete: conditioned_dem.tif")

# 4. D8 Flow Accumulation & Contours
print("\n[3/6] Calculating flow accumulation...")
wbt.breach_depressions("conditioned_dem.tif", "breached.tif")
wbt.d8_flow_accumulation("breached.tif", "flow_acc.tif")

print("Generating GeoJSON contours...")
with rasterio.open("flow_acc.tif") as src:
    data = src.read(1)
    threshold = np.percentile(data[data > 0], 95)
    mask = data > threshold
    
    results = (
        {'properties': {'flow_value': v}, 'geometry': shape(s)}
        for i, (s, v) in enumerate(shapes(data, mask=mask, transform=src.transform))
    )
    flow_gdf = gpd.GeoDataFrame.from_features(list(results), crs="EPSG:4326")
    flow_gdf.to_file(os.path.join(OUTPUT_DIR, "flow_accumulation.geojson"), driver='GeoJSON')
print("DONE: Flow accumulation contours saved.")

# 5. Infrastructure & Synthetic Sampling
print("\n[4/6] Querying OSM for drains...")
tags = {'waterway': 'drain'}
drains = ox.features_from_bbox(bbox=(WEST, SOUTH, EAST, NORTH), tags=tags)
drains.to_file(os.path.join(OUTPUT_DIR, "drains_osm.geojson"), driver='GeoJSON')

print("Generating 50 synthetic CV points...")
np.random.seed(42)
lons = np.random.uniform(WEST, EAST, 50)
lats = np.random.uniform(SOUTH, NORTH, 50)
points = [Point(x, y) for x, y in zip(lons, lats)]
cv_gdf = gpd.GeoDataFrame(geometry=points, crs="EPSG:4326")
cv_gdf['id'] = range(50)
cv_gdf.to_file(os.path.join(OUTPUT_DIR, "drains_cv.geojson"), driver='GeoJSON')

# Create Boundary
boundary = gpd.GeoDataFrame(geometry=[box(WEST, SOUTH, EAST, NORTH)], crs="EPSG:4326")
boundary.to_file(os.path.join(OUTPUT_DIR, "bwaise_boundary.geojson"), driver='GeoJSON')
print("DONE: Infrastructure and sampling complete.")

# 6. XGBoost Gap Scoring
print("\n[5/6] Building risk scoring model...")
grid_size = 0.001 
x_coords = np.arange(WEST, EAST, grid_size)
y_coords = np.arange(SOUTH, NORTH, grid_size)
polygons = []
for x in x_coords:
    for y in y_coords:
        polygons.append(box(x, y, x + grid_size, y + grid_size))
gap_gdf = gpd.GeoDataFrame(geometry=polygons, crs="EPSG:4326")

def sample_at_center(raster_path, gdf):
    with rasterio.open(raster_path) as src:
        coords = [(p.centroid.x, p.centroid.y) for p in gdf.geometry]
        return [val[0] for val in src.sample(coords)]

gap_gdf['elevation'] = sample_at_center("conditioned_dem.tif", gap_gdf)
gap_gdf['flow_acc'] = sample_at_center("flow_acc.tif", gap_gdf)
drain_geom = drains.unary_union
gap_gdf['dist_drain'] = gap_gdf.geometry.centroid.apply(lambda p: p.distance(drain_geom))

X = gap_gdf[['elevation', 'flow_acc', 'dist_drain']]
y_sim = (X['flow_acc'] > X['flow_acc'].median()) & (X['elevation'] < X['elevation'].median())
model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.05, objective='reg:logistic')
model.fit(X, y_sim.astype(int))

gap_gdf['risk_score'] = model.predict(X)
gap_gdf.to_file(os.path.join(OUTPUT_DIR, "risk_zones.geojson"), driver='GeoJSON')
print("DONE: XGBoost Gap Scoring complete.")

# 7. Final Summary
print("\n[6/6] --- LOCAL PIPELINE COMPLETE ---")
print(f"Results saved to: {os.path.abspath(OUTPUT_DIR)}")
for f in os.listdir(OUTPUT_DIR):
    if f.endswith('.geojson'):
        print(f"  📄 {f}")
