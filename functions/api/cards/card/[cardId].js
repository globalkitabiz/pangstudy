// 개별 카드 관리 API
// GET: 카드 상세 조회
// PUT: 카드 수정
// DELETE: 카드 삭제

export async function onRequestGet(context) {
    const { env, params } = context;
    const cardId = params.cardId;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        const card = await env.DB.prepare(
            `SELECT c.* FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE c.id = ? AND d.user_id = ?`
        ).bind(cardId, userId).first();

        if (!card) {
            return new Response(JSON.stringify({ error: '카드를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ card }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get card error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { request, env, params } = context;
    const cardId = params.cardId;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        // 카드 소유권 확인
        const card = await env.DB.prepare(
            `SELECT c.* FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE c.id = ? AND d.user_id = ?`
        ).bind(cardId, userId).first();

        if (!card) {
            return new Response(JSON.stringify({ error: '카드를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { front, back, media_front, media_back } = await request.json();

        if (!front || !back) {
            return new Response(JSON.stringify({ error: '앞면과 뒷면은 필수입니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            `UPDATE cards SET front = ?, back = ?, media_front = ?, media_back = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(
            front,
            back,
            media_front ? JSON.stringify(media_front) : null,
            media_back ? JSON.stringify(media_back) : null,
            cardId
        ).run();

        return new Response(JSON.stringify({
            success: true,
            message: '카드가 수정되었습니다.',
            card: { id: cardId, front, back }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Update card error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { env, params } = context;
    const cardId = params.cardId;

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        // 카드 소유권 확인
        const card = await env.DB.prepare(
            `SELECT c.* FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE c.id = ? AND d.user_id = ?`
        ).bind(cardId, userId).first();

        if (!card) {
            return new Response(JSON.stringify({ error: '카드를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 리뷰 기록 삭제
        await env.DB.prepare('DELETE FROM reviews WHERE card_id = ?').bind(cardId).run();

        // 카드 삭제
        await env.DB.prepare('DELETE FROM cards WHERE id = ?').bind(cardId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '카드가 삭제되었습니다.'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete card error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
