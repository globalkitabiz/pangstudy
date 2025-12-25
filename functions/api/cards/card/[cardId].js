// 개별 카드 관리 API
// GET: 카드 상세 조회
// PUT: 카드 수정
// DELETE: 카드 삭제

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
    const cardId = params.cardId;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

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

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

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

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

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
