// 로그인 API
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password } = await request.json();

        // 입력 검증
        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 사용자 조회
        const user = await env.DB.prepare(
            'SELECT id, email, username, password_hash FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 비밀번호 확인
        const passwordHash = await hashPassword(password);
        if (passwordHash !== user.password_hash) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // JWT 토큰 생성
        const token = await createJWT(
            { userId: user.id, email: user.email },
            env.JWT_SECRET
        );

        return new Response(JSON.stringify({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
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

// JWT 토큰 생성
async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7일

    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify({ ...payload, exp }));

    const signature = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${headerB64}.${payloadB64}.${secret}`)
    );
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}
