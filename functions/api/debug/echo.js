export async function onRequestGet(context) {
  const { request } = context;
  const headers = {};
  for (const [k, v] of request.headers) {
    headers[k] = v;
  }
  return new Response(JSON.stringify({ headers }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
