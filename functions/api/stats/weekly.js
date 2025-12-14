// 주간 학습 통계 API
export async function onRequestGet(context) {
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
