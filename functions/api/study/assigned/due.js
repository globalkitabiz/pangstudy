// 현재 사용자에게 기한이 지난(또는 기한 미설정) 할당 반환
export async function onRequestGet(context) {
    const { env } = context;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = context.user.userId;

    try {
        const rows = await env.DB.prepare(
            `SELECT a.*, c.front as card_front, c.back as card_back, d.name as deck_name
             FROM assignments a
             LEFT JOIN cards c ON a.card_id = c.id
             LEFT JOIN decks d ON a.deck_id = d.id
             WHERE a.user_id = ?
               AND a.status = 'assigned'
               AND (a.due_date IS NULL OR a.due_date <= DATETIME('now'))
             ORDER BY a.due_date IS NULL, a.due_date ASC`
        ).bind(userId).all();

        return new Response(JSON.stringify({ assignments: rows.results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Get assigned due error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
