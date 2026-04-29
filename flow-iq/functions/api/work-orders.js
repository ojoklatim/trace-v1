export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const payload = await request.json();
    const timestamp = Date.now();
    const order = {
      id: `wo_${timestamp}_${crypto.randomUUID()}`,
      recommendation: payload.recommendation || '',
      feature: payload.feature || null,
      status: 'created',
      created_at: new Date(timestamp).toISOString(),
    };

    if (env.WORK_ORDERS) {
      await env.WORK_ORDERS.put(order.id, JSON.stringify(order));
    }

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const orders = [];
    if (env.WORK_ORDERS) {
      const list = await env.WORK_ORDERS.list();
      for (const key of list.keys) {
        const value = await env.WORK_ORDERS.get(key.name);
        if (value) orders.push(JSON.parse(value));
      }
      orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }

    return new Response(JSON.stringify(orders), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
