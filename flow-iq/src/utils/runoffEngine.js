/**
 * TRACE Runoff Simulation Engine
 * SCS Curve Number method + D8 flow routing for Bwaise DEM
 */

const D8_DR = [-1, -1, -1, 0, 0, 1, 1, 1];
const D8_DC = [-1, 0, 1, -1, 1, -1, 0, 1];
const D8_DIST = [Math.SQRT2, 1, Math.SQRT2, 1, 1, Math.SQRT2, 1, Math.SQRT2];

export function parseDEM(csvText) {
  const lines = csvText.trim().split('\n');
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    points.push({
      lon: parseFloat(parts[0]),
      lat: parseFloat(parts[1]),
      elev: parseFloat(parts[2])
    });
  }

  const lonSet = new Set(points.map(p => p.lon.toFixed(8)));
  const latSet = new Set(points.map(p => p.lat.toFixed(8)));
  const lons = [...lonSet].map(Number).sort((a, b) => a - b);
  const lats = [...latSet].map(Number).sort((a, b) => b - a);

  const nCols = lons.length;
  const nRows = lats.length;
  const cellSize = lons.length > 1 ? Math.abs(lons[1] - lons[0]) : 0.000278;

  const elevations = Array.from({ length: nRows }, () => new Float32Array(nCols));
  const lonIdx = new Map();
  const latIdx = new Map();
  lons.forEach((v, i) => lonIdx.set(v.toFixed(8), i));
  lats.forEach((v, i) => latIdx.set(v.toFixed(8), i));

  for (const p of points) {
    const c = lonIdx.get(p.lon.toFixed(8));
    const r = latIdx.get(p.lat.toFixed(8));
    if (r !== undefined && c !== undefined) elevations[r][c] = p.elev;
  }

  return { nRows, nCols, elevations, lons, lats, cellSize };
}

export function computeFlowDirections(grid) {
  const { nRows, nCols, elevations, cellSize } = grid;
  const flowDir = Array.from({ length: nRows }, () => new Int8Array(nCols).fill(-1));
  const cellSizeM = cellSize * 111320;

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      let maxSlope = 0, bestDir = -1;
      for (let d = 0; d < 8; d++) {
        const nr = r + D8_DR[d], nc = c + D8_DC[d];
        if (nr < 0 || nr >= nRows || nc < 0 || nc >= nCols) continue;
        const slope = (elevations[r][c] - elevations[nr][nc]) / (D8_DIST[d] * cellSizeM);
        if (slope > maxSlope) { maxSlope = slope; bestDir = d; }
      }
      flowDir[r][c] = bestDir;
    }
  }
  return flowDir;
}

export function computeFlowAccumulation(grid, flowDir) {
  const { nRows, nCols, elevations } = grid;
  const flowAcc = Array.from({ length: nRows }, () => new Float32Array(nCols).fill(1));
  const cells = [];
  for (let r = 0; r < nRows; r++)
    for (let c = 0; c < nCols; c++)
      cells.push({ r, c, elev: elevations[r][c] });
  cells.sort((a, b) => b.elev - a.elev);

  for (const { r, c } of cells) {
    const d = flowDir[r][c];
    if (d < 0) continue;
    const nr = r + D8_DR[d], nc = c + D8_DC[d];
    if (nr >= 0 && nr < nRows && nc >= 0 && nc < nCols)
      flowAcc[nr][nc] += flowAcc[r][c];
  }
  return flowAcc;
}

export function runSimulation({ grid, flowAcc, rainfallMmHr = 50, durationMin = 60, curveNumber = 85, nFrames = 50 }) {
  const { nRows, nCols } = grid;
  const S = 25400 / curveNumber - 254;
  const Ia = 0.2 * S;

  let maxFA = 0;
  for (let r = 0; r < nRows; r++)
    for (let c = 0; c < nCols; c++)
      maxFA = Math.max(maxFA, flowAcc[r][c]);

  const cellSizeM = grid.cellSize * 111320;
  const cellAreaM2 = cellSizeM * cellSizeM;
  const frames = [];

  for (let f = 0; f <= nFrames; f++) {
    const t = (f / nFrames) * durationMin;
    const P = rainfallMmHr * (t / 60);
    let Q = 0;
    if (P > Ia) Q = Math.pow(P - Ia, 2) / (P + 0.8 * S);

    const depths = new Float32Array(nRows * nCols);
    let maxDepth = 0, totalVolumeM3 = 0;

    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const idx = r * nCols + c;
        const fa = flowAcc[r][c];
        const depth = Q * Math.sqrt(fa / maxFA) * 2.5;
        depths[idx] = depth;
        maxDepth = Math.max(maxDepth, depth);
        totalVolumeM3 += (depth / 1000) * cellAreaM2;
      }
    }

    const prevVol = f > 0 ? frames[f - 1].totalVolumeM3 : 0;
    const dt = durationMin / nFrames;
    const discharge = Math.max(0, (totalVolumeM3 - prevVol) / (dt * 60));

    frames.push({ frameIndex: f, time: t, cumulativeRainfall: P, excessRainfall: Q, maxDepth, totalVolumeM3, discharge, depths });
  }
  return frames;
}

export function frameToGeoJSON(frame, grid, threshold = 0.3) {
  const { nRows, nCols, lons, lats, cellSize, elevations } = grid;
  const features = [];
  const h = cellSize / 2;

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const depth = frame.depths[r * nCols + c];
      if (depth < threshold) continue;
      const lon = lons[c], lat = lats[r];
      features.push({
        type: 'Feature',
        properties: { water_depth: depth, elevation: elevations[r][c] },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lon - h, lat - h], [lon + h, lat - h], [lon + h, lat + h], [lon - h, lat + h], [lon - h, lat - h]]]
        }
      });
    }
  }
  return { type: 'FeatureCollection', features };
}
