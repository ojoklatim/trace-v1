# TRACE - Flood Risk Intelligence System

This repository contains the TRACE project, an end-to-end system for flood risk analysis and visualization.

## 📁 Project Structure

- **`/flow-iq`**: The main web application (React + Cloudflare Pages Functions).
- **`/backend`**: (Legacy) Original FastAPI backend. Note: For Cloudflare hosting, the logic has been moved to `/flow-iq/functions`.
- **Root Notebooks**: Jupyter notebooks used for hydrological analysis and data processing:
    - `trace.ipynb`: Core analysis pipeline.
    - `flow_iq_day1_bwaise.ipynb`: Targeted analysis for Bwaise region.
- **Datasets**: GeoTIFF files and GeoJSON outputs used for the visualization layers.

## 🚀 Quick Start (Web App)

The web application is optimized for **Cloudflare Pages**.

1.  Navigate to the `flow-iq` directory.
2.  Install dependencies: `npm install`.
3.  Deploy to Cloudflare via GitHub integration (see `flow-iq/README.md` for detailed steps).

## 🛠 Analysis Pipeline

The hydrological analysis is performed using Python. The results (GeoJSON layers) are stored in `flow-iq/src/data` for use in the dashboard.

- `trace_local_pipeline.py`: Script to automate data conditioning and flow accumulation.

## 🌍 Hosting

The dashboard is designed to be hosted on **Cloudflare Free Tier**. It uses Cloudflare Pages for the frontend and Cloudflare Pages Functions for real-time sensor simulation.
