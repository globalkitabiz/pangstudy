// 사용자가 할당된 카드 리뷰 완료 처리
export async function onRequestPost(context) {
    const { env, params } = context;
    const id = params.id;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = context.user.userId;

    try {
        const assignment = await env.DB.prepare('SELECT * FROM assignments WHERE id = ? AND user_id = ?').bind(id, userId).first();
        if (!assignment) {
            return new Response(JSON.stringify({ error: 'Assignment not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const repeat = assignment.repeat_interval_days || 0;

        if (repeat > 0) {
            // 다음 복습일 설정
            await env.DB.prepare("UPDATE assignments SET due_date = DATETIME('now', '+' || ? || ' days'), status = 'assigned' WHERE id = ?").bind(repeat, id).run();
            const next = await env.DB.prepare('SELECT due_date FROM assignments WHERE id = ?').bind(id).first();
            return new Response(JSON.stringify({ success: true, next_due: next.due_date }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            // 반복이 없으면 완료 처리
            await env.DB.prepare("UPDATE assignments SET status = 'completed' WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true, status: 'completed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('Review assignment error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
