// 카드 복습 제출 API (SM-2 알고리즘)
export async function onRequestPost(context) {
    const { request, env } = context;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

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
