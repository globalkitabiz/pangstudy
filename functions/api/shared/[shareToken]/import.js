// 공유된 덱 가져오기 API

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
    const shareToken = params.shareToken;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

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
            'INSERT INTO decks (user_id, name, description, source, author, license, commercial_allowed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            userId,
            `${shared.name} (공유됨)`,
            shared.description,
            shared.source || `Shared import: ${shared.id}`,
            shared.author || null,
            shared.license || null,
            shared.commercial_allowed ? 1 : 0
        ).run();

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
