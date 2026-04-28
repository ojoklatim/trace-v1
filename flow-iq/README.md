# TRACE - Flood Risk Intelligence Dashboard

A high-performance flood risk visualization platform built with React, Vite, Deck.gl, and Mapbox.

## 🚀 Cloudflare Deployment Instructions

This project is optimized for the **Cloudflare Free Tier**.

### 1. Repository Setup
Push this code to a GitHub or GitLab repository.

### 2. Cloudflare Pages Configuration
1.  Log in to the **Cloudflare Dashboard**.
2.  Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3.  Select your repository.
4.  Set the following build settings:
    *   **Project Name**: `trace-flow-iq`
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `flow-iq`
    *   **Build Command**: `npm run build`
    *   **Build Output Directory**: `dist`

### 3. Setup KV Storage (For Live Simulation)
To enable the "Simulate Storm" feature, you need to bind a KV namespace:
1.  In Cloudflare Dashboard, go to **Workers & Pages** > **KV**.
2.  Click **Create namespace** and name it `TRACE_STATE`.
3.  Go to your Pages project > **Settings** > **Functions**.
4.  Under **KV namespace bindings**, click **Add binding**.
5.  **Variable name**: `STATE`
6.  **KV namespace**: `TRACE_STATE`
7.  **Redeploy** your application.

## 🛠 Local Development

```bash
# Install dependencies
cd flow-iq
npm install

# Run frontend
npm run dev
```

The backend functions can be tested locally using [Wrangler](https://developers.cloudflare.com/workers/wrangler/):
```bash
npx wrangler pages dev ./dist
```
