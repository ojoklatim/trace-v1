export async function onRequestPost(context) {
  const { env } = context;
  
  if (env.STATE) {
    await env.STATE.put('rainfall_spiked', 'true', { expirationTtl: 300 }); // Auto-reset after 5 mins
  }

  return new Response(JSON.stringify({ 
    message: "Heavy rainfall event triggered", 
    status: "active" 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
