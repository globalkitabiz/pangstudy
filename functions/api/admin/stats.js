// 관리자 대시보드 통계 API
export async function onRequestGet(context) {
    const { env, request, data } = context;

    // 사용자 인증 확인
    let userId;
    if (data?.user?.userId) {
        userId = data.user.userId;
    } else if (context.user?.userId) {
        userId = context.user.userId;
    } else {
        // 직접 JWT 검증
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
    const isAdmin = dbUser && (dbUser.is_admin === 1 || dbUser.is_admin === '1' || dbUser.is_admin === true);

    if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const [usersCount, decksCount, cardsCount, reviewsCount, todayReviews] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM decks').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM cards').first(),
            env.DB.prepare('SELECT COUNT(*) as count FROM reviews').first(),
            env.DB.prepare("SELECT COUNT(*) as count FROM reviews WHERE date(reviewed_at) = date('now')").first()
        ]);

        return new Response(JSON.stringify({
            totalUsers: usersCount?.count || 0,
            totalDecks: decksCount?.count || 0,
            totalCards: cardsCount?.count || 0,
            totalReviews: reviewsCount?.count || 0,
            todayReviews: todayReviews?.count || 0
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get stats' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
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
