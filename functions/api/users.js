// 사용자 API - /api/users

export async function onRequestGet(context) {
    const { env, request } = context;

    // 인증 확인
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

    // 관리자가 아니어도 기본 사용자 목록은 볼 수 있도록 (기존 호환)
    try {
        const rows = await env.DB.prepare(
            'SELECT id, email, username as name, is_admin FROM users ORDER BY id ASC'
        ).all();

        return new Response(JSON.stringify({ users: rows.results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Get users error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // 인증 확인
    if (!context.user || !context.user.userId) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
        try {
            const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
            context.user = payload;
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: err.message }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 이메일 중복 체크
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
            return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 비밀번호 해시
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const result = await env.DB.prepare(
            'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
        ).bind(email, name || email.split('@')[0], hashHex).run();

        const user = {
            id: result.meta.last_row_id,
            email,
            name: name || email.split('@')[0]
        };

        return new Response(JSON.stringify({ success: true, user }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Add user error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

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
