export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { eventType, deckId = null, variant = null, userId = null } = body;
  if (!eventType) return new Response(JSON.stringify({ error: 'missing_eventType' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    const db = env.DB;
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO recommendation_events (event_type, deck_id, user_id, variant, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(eventType, deckId, userId, variant, now)
      .run();
  } catch (e) {
    console.error('analytics insert error', e);
    return new Response(JSON.stringify({ error: 'db_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
