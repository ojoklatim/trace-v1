export async function onRequestGet(context) {
  const { env } = context;
  
  // Try to get storm state from KV, default to false if KV not bound
  let rainfallSpiked = false;
  if (env.STATE) {
    const state = await env.STATE.get('rainfall_spiked');
    rainfallSpiked = state === 'true';
  }

  const alertThreshold = 450.0;
  const sensors = [];
  
  // Recreate the logic from main.py
  for (let i = 1; i <= 20; i++) {
    let value;
    if (rainfallSpiked) {
      // Spike: 400 - 600 mm
      value = 400 + Math.random() * 200;
    } else {
      // Nominal: 120 - 200 mm
      value = 120 + Math.random() * 80;
    }
    
    const status = value > alertThreshold ? 'critical' : 'nominal';
    
    sensors.push({
      id: i,
      name: `KLA-NODE-${String(i).padStart(2, '0')}`,
      lat: 0.26 + Math.random() * 0.16,
      lon: 32.52 + Math.random() * 0.14,
      value: parseFloat(value.toFixed(1)),
      status: status
    });
  }

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    sensors: sensors,
    alert_active: sensors.some(s => s.status === 'critical')
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
