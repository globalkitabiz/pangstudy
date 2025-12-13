// 회원가입 API
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password, username } = await request.json();

        // 입력 검증
        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 이메일 중복 확인
        const existing = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();

        if (existing) {
            return new Response(JSON.stringify({ error: 'Email already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 비밀번호 해싱
        const passwordHash = await hashPassword(password);

        // 사용자 생성
        const result = await env.DB.prepare(
            'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)'
        ).bind(email, passwordHash, username || null).run();

        const userId = result.meta.last_row_id;

        // JWT 토큰 생성
        const token = await createJWT({ userId, email }, env.JWT_SECRET);

        return new Response(JSON.stringify({
            success: true,
            token,
            user: { id: userId, email, username }
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Register error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 비밀번호 해싱
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// JWT 토큰 생성 (수정된 버전)
async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7일

    // Base64 URL 인코딩 (btoa 대신 사용)
    const base64url = (str) => {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };

    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify({ ...payload, exp }));

    // 서명 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}
