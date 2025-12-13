// 공유된 덱 가져오기 API
export async function onRequestPost(context) {
    const { env, params } = context;
    const shareToken = params.shareToken;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        // 공유된 덱 조회
        const shared = await env.DB.prepare(
            `SELECT sd.share_token, d.id, d.name, d.description
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

        // 새 덱 생성 (복사)
        const newDeckResult = await env.DB.prepare(
            'INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)'
        ).bind(userId, `${shared.name} (공유됨)`, shared.description).run();

        const newDeckId = newDeckResult.meta.last_row_id;

        // 카드 복사
        const cards = await env.DB.prepare(
            'SELECT front, back, media_front, media_back FROM cards WHERE deck_id = ?'
        ).bind(shared.id).all();

        for (const card of cards.results) {
            await env.DB.prepare(
                'INSERT INTO cards (deck_id, front, back, media_front, media_back) VALUES (?, ?, ?, ?, ?)'
            ).bind(newDeckId, card.front, card.back, card.media_front, card.media_back).run();
        }

        return new Response(JSON.stringify({
            success: true,
            deckId: newDeckId,
            message: `덱 "${shared.name}"을(를) 가져왔습니다. (${cards.results.length}개 카드)`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import shared deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
