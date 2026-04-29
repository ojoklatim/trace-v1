export async function onRequestPost(context) {
  const { env, request } = context;
  
  if (!env.AI) {
    return new Response(JSON.stringify({ 
      error: "Cloudflare Workers AI is not bound in this environment." 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { risk_score, elevation, dist_drain, flow_acc } = await request.json();
    const aiModel = env.AI_INSIGHTS_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    const systemPrompt = `You are a flood drainage engineer specialized in Kampala's informal settlements. 
    Provide specific structural recommendations and a rough Bill of Quantities (BoQ) estimate in UGX.
    Costs (Estimate): 600mm RCP = 250k/m, 900mm = 450k/m, 1200mm = 700k/m. Masonry Lining = 150k/m.
    Standards: Use RCP diameters. Keep it concise (max 3 sentences).`;

    const userPrompt = `Hydrological Analysis for Site:
    - Risk Score: ${risk_score.toFixed(2)}
    - Elevation Delta: ${elevation.toFixed(2)}m
    - Distance to nearest Drain: ${dist_drain.toFixed(1)}m
    - Flow Accumulation: ${flow_acc.toFixed(0)} units
    
    Provide a structural recommendation and a rough BoQ cost estimate in UGX:`;

    const response = await env.AI.run(aiModel, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return new Response(JSON.stringify({ 
      recommendation: response.response,
      model: aiModel
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
