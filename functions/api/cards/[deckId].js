// 특정 덱의 카드 관리 API
// GET: 덱의 모든 카드 조회
// POST: 새 카드 추가

// JWT 검증 함수 (inline)
async function verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const [headerB64, payloadB64, signatureB64] = parts;
    const base64urlDecode = (str) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    };
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('Token expired');
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC', key, sigBytes, data)) throw new Error('Invalid signature');
    return payload;
}

// JWT fallback 인증 헬퍼
async function authenticateUser(context) {
    const { request, env } = context;
    if (context.user && context.user.userId) {
        return { success: true, userId: context.user.userId };
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false };
    }
    try {
        const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
        context.user = payload;
        return { success: true, userId: payload.userId };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function onRequestGet(context) {
    const { env, params } = context;
    const deckId = params.deckId;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }
    const userId = auth.userId;

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
    const deckId = params.deckId;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }
    const userId = auth.userId;

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
