// 카드 복습 제출 API (SM-2 알고리즘)

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
    const { request, env } = context;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        const { cardId, difficulty } = await request.json();

        // difficulty: 0=다시, 1=어려움, 2=보통, 3=쉬움
        if (![0, 1, 2, 3].includes(difficulty)) {
            return new Response(JSON.stringify({ error: 'Invalid difficulty' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 기존 복습 기록 조회
        const review = await env.DB.prepare(
            'SELECT * FROM reviews WHERE card_id = ? AND user_id = ?'
        ).bind(cardId, userId).first();

        let easeFactor = review ? review.ease_factor : 2.5;
        let interval = review ? review.interval_days : 0;
        let repetitions = review ? review.repetitions : 0;

        // SM-2 알고리즘 적용
        if (difficulty === 0) {
            // 다시: 처음부터
            repetitions = 0;
            interval = 0;
        } else {
            // 난이도에 따라 ease factor 조정
            easeFactor = easeFactor + (0.1 - (3 - difficulty) * (0.08 + (3 - difficulty) * 0.02));

            if (easeFactor < 1.3) {
                easeFactor = 1.3;
            }

            if (difficulty < 2) {
                // 어려움: 다시 시작
                repetitions = 0;
                interval = 0;
            } else {
                // 보통 또는 쉬움
                if (repetitions === 0) {
                    interval = 1;
                } else if (repetitions === 1) {
                    interval = 6;
                } else {
                    interval = Math.round(interval * easeFactor);
                }
                repetitions++;
            }
        }

        // 다음 복습 시간 계산
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);
        const nextReviewStr = nextReview.toISOString().replace('T', ' ').substring(0, 19);

        // 복습 기록 저장/업데이트
        if (review) {
            await env.DB.prepare(
                `UPDATE reviews
                 SET ease_factor = ?, interval_days = ?, repetitions = ?,
                     next_review = ?, reviewed_at = DATETIME('now')
                 WHERE card_id = ? AND user_id = ?`
            ).bind(easeFactor, interval, repetitions, nextReviewStr, cardId, userId).run();
        } else {
            await env.DB.prepare(
                `INSERT INTO reviews (card_id, user_id, ease_factor, interval_days, repetitions, next_review)
                 VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(cardId, userId, easeFactor, interval, repetitions, nextReviewStr).run();
        }

        return new Response(JSON.stringify({
            success: true,
            nextReview: nextReviewStr,
            interval,
            message: interval === 0 ? '다시 학습합니다' : `${interval}일 후 복습`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit review error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
