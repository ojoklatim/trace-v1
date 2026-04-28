export async function onRequestPost(context) {
  const { env } = context;
  
  if (env.STATE) {
    await env.STATE.put('rainfall_spiked', 'false');
  }

  return new Response(JSON.stringify({ 
    message: "Sensors reset to baseline" 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
