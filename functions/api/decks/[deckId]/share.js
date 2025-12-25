// 덱 공유 API

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

export async function onRequestPost(context) {
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
            'SELECT id, name FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: 'Deck not found or access denied' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 기존 공유 토큰 확인
        const existing = await env.DB.prepare(
            'SELECT share_token FROM shared_decks WHERE deck_id = ?'
        ).bind(deckId).first();

        if (existing) {
            return new Response(JSON.stringify({
                success: true,
                shareToken: existing.share_token,
                shareUrl: `${new URL(context.request.url).origin}/shared/${existing.share_token}`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 새 공유 토큰 생성 (UUID)
        const shareToken = crypto.randomUUID();

        await env.DB.prepare(
            'INSERT INTO shared_decks (share_token, deck_id) VALUES (?, ?)'
        ).bind(shareToken, deckId).run();

        return new Response(JSON.stringify({
            success: true,
            shareToken,
            shareUrl: `${new URL(context.request.url).origin}/shared/${shareToken}`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Share deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
