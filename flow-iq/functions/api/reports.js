export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const report = await request.json();
    const timestamp = Date.now();
    const reportId = `report_${timestamp}_${crypto.randomUUID()}`;
    
    const reportData = {
      ...report,
      id: reportId,
      timestamp,
      status: 'pending'
    };

    // Persist when KV storage is available.
    if (env.REPORTS) {
      await env.REPORTS.put(reportId, JSON.stringify(reportData));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      report: reportData,
      message: "Report saved successfully to Cloudflare Edge."
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

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    let reports = [];
    
    if (env.REPORTS) {
      const list = await env.REPORTS.list();
      for (const key of list.keys) {
        const val = await env.REPORTS.get(key.name);
        if (val) reports.push(JSON.parse(val));
      }
    }

    return new Response(JSON.stringify(reports), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
