// CSV 일괄 가져오기 API
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // 인증 확인
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const JWT_SECRET = env.JWT_SECRET || 'your-secret-key';

        // JWT 검증 (간단한 방식)
        const parts = token.split('.');
        if (parts.length !== 3) {
            return new Response(JSON.stringify({ error: '유효하지 않은 토큰' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payload = JSON.parse(atob(parts[1]));
        const userId = payload.userId;

        // 요청 데이터 파싱
        const { deckId, cards } = await request.json();

        if (!deckId || !cards || !Array.isArray(cards) || cards.length === 0) {
            return new Response(JSON.stringify({ error: '덱 ID와 카드 데이터가 필요합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 덱 소유권 확인
        const deck = await env.DB.prepare(
            'SELECT * FROM decks WHERE id = ? AND user_id = ?'
        ).bind(deckId, userId).first();

        if (!deck) {
            return new Response(JSON.stringify({ error: '덱을 찾을 수 없거나 권한이 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 카드 일괄 생성
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];

            if (!card.front || !card.back) {
                errorCount++;
                errors.push(`행 ${i + 1}: 앞면과 뒷면이 모두 필요합니다`);
                continue;
            }

            try {
                await env.DB.prepare(
                    'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)'
                ).bind(deckId, card.front.trim(), card.back.trim()).run();
                successCount++;
            } catch (err) {
                errorCount++;
                errors.push(`행 ${i + 1}: ${err.message}`);
            }
        }

        return new Response(JSON.stringify({
            message: `${successCount}개 카드 생성 완료${errorCount > 0 ? `, ${errorCount}개 실패` : ''}`,
            successCount,
            errorCount,
            errors: errors.slice(0, 10) // 최대 10개 에러만 반환
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('CSV 가져오기 오류:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
