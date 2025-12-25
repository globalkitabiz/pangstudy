// 간단한 추천 API (MVP)
export async function onRequestGet(context) {
    const { env } = context;

    // If middleware didn't attach user (for some deployments), try to verify JWT here as fallback
    if ((!context.user || !context.user.userId) && context.request) {
        const authHeader = context.request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = await (async function verifyJWT(token, secret) {
                    const parts = token.split('.');
                    if (parts.length !== 3) throw new Error('Invalid token format');
                    const [headerB64, payloadB64, signatureB64] = parts;
                    const base64urlDecode = (str) => {
                        str = str.replace(/-/g, '+').replace(/_/g, '/');
                        while (str.length % 4) str += '=';
                        // atob available in Workers
                        return atob(str);
                    };
                    const payloadObj = JSON.parse(base64urlDecode(payloadB64));
                    if (payloadObj.exp && payloadObj.exp < Date.now() / 1000) throw new Error('Token expired');
                    const encoder = new TextEncoder();
                    const data = encoder.encode(`${headerB64}.${payloadB64}`);
                    const keyData = encoder.encode(secret);
                    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
                    const signatureBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));
                    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
                    if (!isValid) throw new Error('Invalid signature');
                    return payloadObj;
                })(token, env.JWT_SECRET);

                context.user = payload;
            } catch (e) {
                console.warn('Recommendations: fallback JWT verify failed:', e && e.message ? e.message : e);
            }
        }
    }

    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;


    try {
        const url = new URL(context.request.url);
        const params = url.searchParams;
        const onlyMy = params.get('my') === '1';

        // 가중치: 환경변수로 오버라이드 가능
        const weightDue = Number(env.REC_WEIGHT_DUE) || 5;
        const weightAssigned = Number(env.REC_WEIGHT_ASSIGNED) || 10;
        const weightRecent = Number(env.REC_WEIGHT_RECENT) || 1;
        const weightWrong = Number(env.REC_WEIGHT_WRONG) || 8;

        // 캐시 TTL
        const cacheSeconds = Number(env.REC_CACHE_SECONDS) || 30;

                // 1) DB schema를 확인해 reviews 테이블의 next-review 컬럼 이름을 결정
                const cols = await env.DB.prepare("PRAGMA table_info(reviews)").all();
                const colNames = (cols && cols.results) ? cols.results.map(c => c.name) : [];
                const nextCol = colNames.includes('next_review') ? 'next_review' : (colNames.includes('next_review_date') ? 'next_review_date' : null);

                // 2) 사용자의 덱들에 대해 due 카드 수, 할당된 due 수, 최근 7일 내 활동, 오답 횟수 계산
                const nextCondition = nextCol ? `((r.${nextCol} IS NULL) OR r.${nextCol} <= DATETIME('now'))` : '(1=1)';

                const userDecksQuery = `
                        SELECT d.id, d.name, d.user_id,
                            (SELECT COUNT(*) FROM cards c LEFT JOIN reviews r ON c.id = r.card_id AND r.user_id = ?
                             WHERE c.deck_id = d.id AND ${nextCondition})
                            AS due_count,
                            (SELECT COUNT(*) FROM assignments a WHERE a.user_id = ? AND a.deck_id = d.id
                             AND (a.due_date IS NULL OR a.due_date <= DATETIME('now'))) AS assigned_due,
                            (SELECT COUNT(*) FROM reviews rv WHERE rv.user_id = ? AND rv.card_id IN (SELECT id FROM cards WHERE deck_id = d.id)
                             AND DATE(rv.reviewed_at) >= DATE('now','-7 day')) AS recent_reviews,
                            (SELECT COUNT(*) FROM reviews rv2 WHERE rv2.user_id = ? AND rv2.card_id IN (SELECT id FROM cards WHERE deck_id = d.id)
                             AND rv2.difficulty <= 1) AS wrong_count
                        FROM decks d
                        WHERE d.user_id = ?
                        LIMIT 200
                `;

                // 먼저 KV에서 캐시가 있는지 확인 (키에 userId와 필터/가중치를 포함)
        const cacheKeyProbe = `rec:${userId}:my=${onlyMy}:w=${weightDue}_${weightAssigned}_${weightRecent}_${weightWrong}`;
        if (env.REC_CACHE_NAMESPACE) {
            try {
                const cached = await env.REC_CACHE_NAMESPACE.get(cacheKeyProbe);
                if (cached) {
                    return new Response(cached, {
                        status: 200,
                        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${cacheSeconds}` }
                    });
                }
            } catch (kvErr) {
                console.warn('KV get failed:', kvErr);
            }
        }

        const userDecks = await env.DB.prepare(userDecksQuery).bind(userId, userId, userId, userId, userId).all();

        // 2) 인기(다른 사용자들이 최근에 많이 본/복습한) 덱 — onlyMy가 아닐 때만 조회
        let popularDecks = { results: [] };
        if (!onlyMy) {
            const popularQuery = `
                SELECT d.id, d.name, d.user_id,
                  (SELECT COUNT(*) FROM reviews rv WHERE rv.card_id IN (SELECT id FROM cards WHERE deck_id = d.id)
                   AND DATE(rv.reviewed_at) >= DATE('now','-7 day')) AS recent_reviews
                FROM decks d
                WHERE d.user_id != ?
                ORDER BY recent_reviews DESC
                LIMIT 100
            `;
            popularDecks = await env.DB.prepare(popularQuery).bind(userId).all();
        }

        // 점수 계산: 가중치 기반의 간단한 점수화(오답은 개인화 인자)
        const recommendationsMap = new Map();

        const addRecommendation = (deck, score, meta = {}) => {
            if (recommendationsMap.has(deck.id)) {
                const existing = recommendationsMap.get(deck.id);
                existing.score += score;
                existing.meta = { ...existing.meta, ...meta };
            } else {
                recommendationsMap.set(deck.id, { id: deck.id, name: deck.name, owner_id: deck.user_id, score, meta });
            }
        };

        if (userDecks && userDecks.results) {
            for (const d of userDecks.results) {
                const due = Number(d.due_count || 0);
                const assigned = Number(d.assigned_due || 0);
                const recent = Number(d.recent_reviews || 0);
                const wrong = Number(d.wrong_count || 0);

                const score = due * weightDue + assigned * weightAssigned + recent * weightRecent + wrong * weightWrong;
                addRecommendation(d, score, { due, assigned, recent, wrong });
            }
        }

        if (popularDecks && popularDecks.results) {
            for (const d of popularDecks.results) {
                const recent = Number(d.recent_reviews || 0);
                const score = recent * weightRecent * 0.5; // 인기 덱은 개인 덱보다 낮은 가중치로 반영
                addRecommendation(d, score, { recent });
            }
        }

        // 정렬 후 상위 N개 선택
        const recommendations = Array.from(recommendationsMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);

        const payload = JSON.stringify({ recommendations });

        // KV 캐시 키 (가중치와 필터에 따라 분리)
        const cacheKey = `rec:${userId}:my=${onlyMy}:w=${weightDue}_${weightAssigned}_${weightRecent}_${weightWrong}`;

        // KV 사용 가능하면 저장
        try {
            if (env.REC_CACHE_NAMESPACE) {
                // expirationTtl는 초 단위
                await env.REC_CACHE_NAMESPACE.put(cacheKey, payload, { expirationTtl: cacheSeconds });
            }
        } catch (kvErr) {
            console.warn('KV put failed:', kvErr);
        }

        return new Response(payload, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${cacheSeconds}` }
        });

    } catch (error) {
        console.error('Recommendations error:', error && error.stack ? error.stack : error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error && error.message ? error.message : String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
