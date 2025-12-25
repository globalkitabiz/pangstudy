// 공통 JWT 인증 유틸리티

// JWT 검증 함수
export async function verifyJWT(token, secret) {
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

// 요청에서 사용자 인증 확인 (미들웨어 fallback 포함)
export async function authenticateRequest(context) {
    const { request, env } = context;

    // 미들웨어가 이미 처리한 경우
    if (context.user && context.user.userId) {
        return { success: true, user: context.user };
    }

    // 미들웨어가 작동하지 않은 경우 직접 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    try {
        const payload = await verifyJWT(token, env.JWT_SECRET);
        context.user = payload;
        return { success: true, user: payload };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// 401 Unauthorized 응답 생성
export function unauthorizedResponse(message = 'Unauthorized') {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

// 403 Forbidden 응답 생성
export function forbiddenResponse(message = 'Forbidden') {
    return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    });
}

// 관리자 인증 확인 (미들웨어 fallback + isAdmin 체크)
export async function authenticateAdmin(context) {
    const { env } = context;

    const auth = await authenticateRequest(context);
    if (!auth.success) {
        return { success: false, error: auth.error, status: 401 };
    }

    // isAdmin 체크 - context.user.isAdmin이 없으면 DB에서 조회
    if (typeof context.user.isAdmin === 'undefined') {
        try {
            const row = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
                .bind(auth.user.userId).first();
            context.user.isAdmin = row && (row.is_admin === 1 || row.is_admin === '1');
        } catch (e) {
            context.user.isAdmin = false;
        }
    }

    if (!context.user.isAdmin) {
        return { success: false, error: 'Admin access required', status: 403 };
    }

    return { success: true, user: context.user };
}
