// 덱 상세 API
// GET: 덱 상세 조회
// PUT: 덱 수정
// DELETE: 덱 삭제

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
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        const deck = await env.DB.prepare(
            `SELECT d.*, COUNT(c.id) as card_count
             FROM decks d
             LEFT JOIN cards c ON d.id = c.deck_id
             WHERE d.id = ? AND d.user_id = ?
             GROUP BY d.id`
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: '덱을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ deck }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { request, env, params } = context;
    const deckId = params.deckId;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        // 덱 소유권 확인
        const deck = await env.DB.prepare(
            'SELECT * FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: '덱을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { name, description } = await request.json();

        if (!name || !name.trim()) {
            return new Response(JSON.stringify({ error: '덱 이름은 필수입니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            'UPDATE decks SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(name.trim(), description || null, deckId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '덱이 수정되었습니다.',
            deck: { id: deckId, name: name.trim(), description }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Update deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { env, params } = context;
    const deckId = params.deckId;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        // 덱 소유권 확인
        const deck = await env.DB.prepare(
            'SELECT * FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: '덱을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 관련 데이터 삭제 (CASCADE가 있지만 명시적으로)
        // 1. 공유 링크 삭제
        await env.DB.prepare('DELETE FROM shared_decks WHERE deck_id = ?').bind(deckId).run();

        // 2. 리뷰 기록 삭제 (카드와 연결된)
        await env.DB.prepare(
            'DELETE FROM reviews WHERE card_id IN (SELECT id FROM cards WHERE deck_id = ?)'
        ).bind(deckId).run();

        // 3. 카드 삭제
        await env.DB.prepare('DELETE FROM cards WHERE deck_id = ?').bind(deckId).run();

        // 4. 덱 삭제
        await env.DB.prepare('DELETE FROM decks WHERE id = ?').bind(deckId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '덱이 삭제되었습니다.'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
