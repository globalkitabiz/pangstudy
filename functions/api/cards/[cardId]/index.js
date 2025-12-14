// 카드 편집 API
// PUT /api/cards/:cardId

export async function onRequestPut(context) {
    const { env, params, request } = context;
    const cardId = params.cardId;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { front, back } = await request.json();

        if (!front || !back) {
            return new Response(JSON.stringify({ error: 'Front and back are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 소유권 확인
        const card = await env.DB.prepare(
            `SELECT c.id FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE c.id = ? AND d.user_id = ?`
        ).bind(cardId, context.user.userId).first();

        if (!card) {
            return new Response(JSON.stringify({ error: 'Card not found or access denied' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 업데이트
        await env.DB.prepare(
            'UPDATE cards SET front = ?, back = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(front, back, cardId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Card updated successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update card error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
