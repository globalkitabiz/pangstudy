// 통계 조회 API

// JWT 검증 함수 (inline) - 함수 호이스팅을 위해 상단에 배치
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
    const { env, request } = context;

    // 사용자 인증 확인 (미들웨어 fallback 포함)
    let userId;
    if (context.user && context.user.userId) {
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
            return new Response(JSON.stringify({ error: 'Unauthorized', details: err.message }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    try {
        // 총 덱 수
        const deckCount = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM decks WHERE user_id = ?'
        ).bind(userId).first();

        // 총 카드 수
        const cardCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE d.user_id = ?`
        ).bind(userId).first();

        // 오늘 학습한 카드 수
        const todayReviews = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM reviews
             WHERE user_id = ? AND DATE(reviewed_at) = DATE('now')`
        ).bind(userId).first();

        // 학습 대기 중인 카드 수 (next_review_date 또는 next_review 사용)
        const dueCards = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM cards c
             JOIN decks d ON c.deck_id = d.id
             LEFT JOIN reviews r ON c.id = r.card_id AND r.user_id = ?
             WHERE d.user_id = ?
             AND (r.id IS NULL OR r.next_review_date <= DATETIME('now'))`
        ).bind(userId, userId).first();

        return new Response(JSON.stringify({
            deckCount: deckCount?.count || 0,
            cardCount: cardCount?.count || 0,
            todayReviews: todayReviews?.count || 0,
            dueCards: dueCards?.count || 0
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
