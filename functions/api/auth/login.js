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
            'SELECT id, email, username, password_hash, is_admin FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 비밀번호 확인
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
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
                username: user.username,
                is_admin: user.is_admin === 1 || user.is_admin === '1' ? true : false
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

// 비밀번호 검증 (솔트 포함)
async function verifyPassword(password, storedHash) {
    // 기존 SHA-256 해시 형식 (솔트 없음) - 이전 버전 호환
    if (!storedHash.includes(':')) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashHex = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return hashHex === storedHash;
    }

    // 새로운 솔트:해시 형식
    const [saltHex, expectedHash] = storedHash.split(':');

    const encoder = new TextEncoder();
    let data = encoder.encode(saltHex + password);

    // 10000번 반복 해싱
    for (let i = 0; i < 10000; i++) {
        const hash = await crypto.subtle.digest('SHA-256', data);
        data = new Uint8Array(hash);
    }

    const hashHex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === expectedHash;
}

// JWT 토큰 생성 (수정된 버전)
async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7일

    // Base64 URL 인코딩
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
