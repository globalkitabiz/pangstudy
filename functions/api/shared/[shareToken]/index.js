// 공유된 덱 조회 API
export async function onRequestGet(context) {
    const { env, params } = context;
    const shareToken = params.shareToken;

    try {
        // 공유된 덱 조회
        const shared = await env.DB.prepare(
            `SELECT sd.share_token, d.id, d.name, d.description, d.created_at
             FROM shared_decks sd
             JOIN decks d ON sd.deck_id = d.id
             WHERE sd.share_token = ?`
        ).bind(shareToken).first();

        if (!shared) {
            return new Response(JSON.stringify({ error: 'Shared deck not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 조회
        const cards = await env.DB.prepare(
            'SELECT id, front, back FROM cards WHERE deck_id = ?'
        ).bind(shared.id).all();

        return new Response(JSON.stringify({
            deck: {
                id: shared.id,
                name: shared.name,
                description: shared.description,
                cardCount: cards.results.length
            },
            cards: cards.results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get shared deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
