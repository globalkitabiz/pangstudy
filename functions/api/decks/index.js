// 덱 관리 API
// GET: 사용자의 모든 덱 조회
// POST: 새 덱 생성

export async function onRequestGet(context) {
    const { env, request } = context;

    // 디버그: context.user 확인
    console.log('[decks/index] context.user:', JSON.stringify(context.user));

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        // 직접 JWT 검증 시도 (미들웨어가 작동하지 않을 경우를 위한 fallback)
        const authHeader = request.headers.get('Authorization');
        console.log('[decks/index] authHeader:', authHeader ? 'present' : 'missing');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = await verifyJWT(token, env.JWT_SECRET);
                console.log('[decks/index] JWT verified via fallback, userId:', payload.userId);
                context.user = payload;
            } catch (err) {
                console.error('[decks/index] JWT fallback verification failed:', err.message);
                return new Response(JSON.stringify({ error: 'Unauthorized', details: err.message }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } else {
            return new Response(JSON.stringify({ error: 'Unauthorized - no token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const userId = context.user.userId;

    try {
        const decks = await env.DB.prepare(
            `SELECT d.*, COUNT(c.id) as card_count
       FROM decks d
       LEFT JOIN cards c ON d.id = c.deck_id
       WHERE d.user_id = ?
       GROUP BY d.id
       ORDER BY d.created_at DESC`
        ).bind(userId).all();

        return new Response(JSON.stringify({ decks: decks.results }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get decks error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // 사용자 인증 확인 (JWT fallback 포함)
    if (!context.user || !context.user.userId) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
                context.user = payload;
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Unauthorized', details: err.message }), {
                    status: 401, headers: { 'Content-Type': 'application/json' }
                });
            }
        } else {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const userId = context.user.userId;

    try {
        const { name, description, source, author, license, commercial_allowed } = await request.json();

        if (!name) {
            return new Response(JSON.stringify({ error: 'Deck name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            'INSERT INTO decks (user_id, name, description, source, author, license, commercial_allowed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            userId,
            name,
            description || null,
            source || null,
            author || null,
            license || null,
            commercial_allowed ? 1 : 0
        ).run();

        const deckId = result.meta.last_row_id;

        return new Response(JSON.stringify({
            success: true,
            deck: { id: deckId, name, description, user_id: userId }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Create deck error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// JWT 검증 함수 (fallback용)
async function verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    const base64urlDecode = (str) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    };

    const payload = JSON.parse(base64urlDecode(payloadB64));

    if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const signatureBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);

    if (!isValid) throw new Error('Invalid signature');
    return payload;
}
