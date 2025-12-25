// 관리자 - 사용자별 통계 API

// JWT 검증 함수 (상단에 배치)
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
        // 가장 기본적인 사용자 목록만 조회
        const users = await env.DB.prepare('SELECT * FROM users ORDER BY id DESC').all();

        const userStats = (users.results || []).map(user => ({
            id: user.id,
            username: user.username || user.name || 'Unknown',
            email: user.email || '',
            name: user.name || '',
            is_admin: user.is_admin,
            deck_count: 0,
            card_count: 0,
            total_reviews: 0,
            today_reviews: 0,
            last_activity: null
        }));

        return new Response(JSON.stringify({ users: userStats }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('user-stats error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get user stats', details: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

