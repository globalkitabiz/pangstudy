// 덱 관리 API
// GET: 사용자의 모든 덱 조회
// POST: 새 덱 생성

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
        const decks = await env.DB.prepare(
            `SELECT d.*, COUNT(c.id) as card_count
       FROM decks d
       LEFT JOIN cards c ON d.id = c.deck_id
       WHERE d.user_id = ?
       GROUP BY d.id
       ORDER BY d.created_at DESC`
        ).bind(userId).all();

        return new Response(JSON.stringify({ decks: decks.results }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get decks error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

    try {
        const { name, description, source, author, license, commercial_allowed } = await request.json();

        if (!name) {
            return new Response(JSON.stringify({ error: 'Deck name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            'INSERT INTO decks (user_id, name, description, source, author, license, commercial_allowed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            userId,
            name,
            description || null,
            source || null,
            author || null,
            license || null,
            commercial_allowed ? 1 : 0
        ).run();

        const deckId = result.meta.last_row_id;

        return new Response(JSON.stringify({
            success: true,
            deck: { id: deckId, name, description, user_id: userId }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Create deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
