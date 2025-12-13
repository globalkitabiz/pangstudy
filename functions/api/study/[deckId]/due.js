// 학습 대기 카드 조회 API
export async function onRequestGet(context) {
    const { env, params } = context;
    const deckId = params.deckId;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

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

        // 학습 대기 중인 카드 조회 (next_review가 현재 시간보다 이전이거나 null)
        const cards = await env.DB.prepare(
            `SELECT c.id, c.front, c.back, 
                    r.next_review, r.ease_factor, r.interval_days, r.repetitions
             FROM cards c
             LEFT JOIN reviews r ON c.id = r.card_id AND r.user_id = ?
             WHERE c.deck_id = ? 
             AND (r.next_review IS NULL OR r.next_review <= DATETIME('now'))
             ORDER BY RANDOM()
             LIMIT 20`
        ).bind(userId, deckId).all();

        return new Response(JSON.stringify({
            deckId,
            cards: cards.results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get due cards error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
