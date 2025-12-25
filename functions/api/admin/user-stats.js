// 관리자 - 사용자별 통계 API
export async function onRequestGet(context) {
    const { env, request, data } = context;

    // 사용자 인증 확인
    let userId;
    if (data?.user?.userId) {
        userId = data.user.userId;
    } else if (context.user?.userId) {
        userId = context.user.userId;
    } else {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
        try {
            const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
            userId = payload.userId;
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // 관리자 권한 확인
    const dbUser = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();
    if (!dbUser || (dbUser.is_admin !== 1 && dbUser.is_admin !== '1' && dbUser.is_admin !== true)) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const users = await env.DB.prepare(`
            SELECT
                u.id, u.username, u.email, u.name,
                (SELECT COUNT(*) FROM decks WHERE user_id = u.id) as deck_count,
                (SELECT COUNT(*) FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = u.id) as card_count,
                (SELECT COUNT(*) FROM reviews r JOIN cards c ON r.card_id = c.id JOIN decks d ON c.deck_id = d.id WHERE d.user_id = u.id) as total_reviews,
                (SELECT COUNT(*) FROM reviews r JOIN cards c ON r.card_id = c.id JOIN decks d ON c.deck_id = d.id WHERE d.user_id = u.id AND date(r.reviewed_at) = date('now')) as today_reviews,
                (SELECT MAX(r.reviewed_at) FROM reviews r JOIN cards c ON r.card_id = c.id JOIN decks d ON c.deck_id = d.id WHERE d.user_id = u.id) as last_activity
            FROM users u
            ORDER BY u.id DESC
        `).all();

        return new Response(JSON.stringify({ users: users.results || [] }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get user stats' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

// JWT 검증 함수
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
