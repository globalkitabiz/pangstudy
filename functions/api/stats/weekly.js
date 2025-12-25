// 주간 학습 통계 API

// JWT 검증 함수 (inline) - 상단에 배치
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

    try {
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

        // 최근 7일간의 학습 데이터 조회
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const weeklyStats = await env.DB.prepare(`
            SELECT
                DATE(reviewed_at) as date,
                COUNT(*) as count
            FROM reviews
            WHERE user_id = ? AND DATE(reviewed_at) >= ?
            GROUP BY DATE(reviewed_at)
            ORDER BY date ASC
        `).bind(userId, sevenDaysAgoStr).all();

        // 7일 전체 데이터 생성 (데이터가 없는 날은 0으로)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const stat = weeklyStats.results.find(s => s.date === dateStr);
            weeklyData.push({
                date: dateStr,
                count: stat ? stat.count : 0
            });
        }

        return new Response(JSON.stringify({ weeklyData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('주간 통계 조회 오류:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
