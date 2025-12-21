export async function onRequestGet(context) {
  const { env } = context;
  try {
    const db = env.DB;
    const res = await db.prepare(`SELECT event_type, variant, COUNT(*) as cnt FROM recommendation_events GROUP BY event_type, variant ORDER BY event_type, variant`).all();
    return new Response(JSON.stringify({ ok: true, rows: res.results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('analytics_stats error', e);
    return new Response(JSON.stringify({ error: 'db_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
