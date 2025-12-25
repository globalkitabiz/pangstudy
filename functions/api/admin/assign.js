// 관리자 전용: 사용자에게 덱 또는 카드 할당 생성
export async function onRequestPost(context) {
    const { request, env } = context;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!context.user.isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        const {
            user_id,
            deck_id = null,
            card_id = null,
            due_date = null,
            repeat_interval_days = 0,
            notes = null
        } = body;

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const result = await env.DB.prepare(
            `INSERT INTO assignments (user_id, card_id, deck_id, assigned_by, due_date, repeat_interval_days, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            user_id,
            card_id,
            deck_id,
            context.user.userId,
            due_date,
            repeat_interval_days || 0,
            notes
        ).run();

        return new Response(JSON.stringify({ success: true, assignmentId: result.meta.last_row_id }), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Admin assign error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
