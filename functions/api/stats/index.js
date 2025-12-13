// 통계 조회 API
export async function onRequestGet(context) {
    const { env } = context;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        // 총 덱 수
        const deckCount = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM decks WHERE user_id = ?'
        ).bind(userId).first();

        // 총 카드 수
        const cardCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE d.user_id = ?`
        ).bind(userId).first();

        // 오늘 학습한 카드 수
        const todayReviews = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM reviews
             WHERE user_id = ? AND DATE(reviewed_at) = DATE('now')`
        ).bind(userId).first();

        // 학습 대기 중인 카드 수
        const dueCards = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM cards c
             JOIN decks d ON c.deck_id = d.id
             LEFT JOIN reviews r ON c.id = r.card_id AND r.user_id = ?
             WHERE d.user_id = ? 
             AND (r.next_review IS NULL OR r.next_review <= DATETIME('now'))`
        ).bind(userId, userId).first();

        return new Response(JSON.stringify({
            deckCount: deckCount.count,
            cardCount: cardCount.count,
            todayReviews: todayReviews.count,
            dueCards: dueCards.count
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
