// 특정 덱의 카드 관리 API
// GET: 덱의 모든 카드 조회
// POST: 새 카드 추가

export async function onRequestGet(context) {
    const { env, params } = context;
    const userId = context.user.userId;
    const deckId = params.deckId;

    try {
        // 덱 소유권 확인
        const deck = await env.DB.prepare(
            'SELECT id FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: 'Deck not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 조회
        const cards = await env.DB.prepare(
            'SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC'
        ).bind(deckId).all();

        return new Response(JSON.stringify({ cards: cards.results }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get cards error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env, params } = context;
    const userId = context.user.userId;
    const deckId = params.deckId;

    try {
        const { front, back, media_front, media_back } = await request.json();

        if (!front || !back) {
            return new Response(JSON.stringify({ error: 'Front and back are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 덱 소유권 확인
        const deck = await env.DB.prepare(
            'SELECT id FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: 'Deck not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 생성
        const result = await env.DB.prepare(
            'INSERT INTO cards (deck_id, front, back, media_front, media_back) VALUES (?, ?, ?, ?, ?)'
        ).bind(
            deckId,
            front,
            back,
            media_front ? JSON.stringify(media_front) : null,
            media_back ? JSON.stringify(media_back) : null
        ).run();

        const cardId = result.meta.last_row_id;

        return new Response(JSON.stringify({
            success: true,
            card: { id: cardId, deck_id: deckId, front, back }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Create card error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
