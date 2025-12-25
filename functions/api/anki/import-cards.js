// Anki import endpoint - receives pre-parsed cards from client
// Client-side JSZip + sql.js handles decompression and SQLite parsing

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

// 인증 헬퍼
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

    // 인증 확인
    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        const body = await request.json();
        const { deckName, cards } = body;

        if (!deckName || !cards || !Array.isArray(cards)) {
            return new Response(JSON.stringify({ error: 'deckName and cards array required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (cards.length === 0) {
            return new Response(JSON.stringify({ error: 'No cards to import' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 덱 생성
        const deckResult = await env.DB.prepare(
            'INSERT INTO decks (name, user_id, created_at) VALUES (?, ?, datetime("now"))'
        ).bind(deckName, userId).run();

        const deckId = deckResult.meta.last_row_id;

        // 카드 삽입 (배치로 처리)
        let insertedCount = 0;
        const batchSize = 50;

        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            const statements = batch.map(card =>
                env.DB.prepare(
                    'INSERT INTO cards (deck_id, front, back, created_at) VALUES (?, ?, ?, datetime("now"))'
                ).bind(deckId, card.front || '', card.back || '')
            );

            await env.DB.batch(statements);
            insertedCount += batch.length;
        }

        return new Response(JSON.stringify({
            success: true,
            deckId,
            deckName,
            cardCount: insertedCount,
            message: `Successfully imported ${insertedCount} cards`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Anki import-cards error:', error);
        return new Response(JSON.stringify({
            error: 'Import failed',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
