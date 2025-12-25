// 관리자 전용: 사용자 관리 API
// GET: 사용자 목록 조회
// DELETE: 사용자 삭제
// PUT: 사용자 정보 수정 (관리자 권한, 비밀번호 재설정)

// 관리자 인증 헬퍼
async function authenticateAdmin(context) {
    const { request, env } = context;

    // 미들웨어가 이미 처리한 경우
    if (context.user && context.user.userId) {
        // isAdmin 체크
        if (typeof context.user.isAdmin === 'undefined') {
            const row = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(context.user.userId).first();
            context.user.isAdmin = row && (row.is_admin === 1 || row.is_admin === '1');
        }
        if (!context.user.isAdmin) {
            return { success: false, status: 403 };
        }
        return { success: true };
    }

    // 직접 JWT 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, status: 401 };
    }

    try {
        const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
        context.user = payload;

        // isAdmin 체크
        const row = await env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(payload.userId).first();
        context.user.isAdmin = row && (row.is_admin === 1 || row.is_admin === '1');

        if (!context.user.isAdmin) {
            return { success: false, status: 403 };
        }
        return { success: true };
    } catch (err) {
        return { success: false, status: 401, error: err.message };
    }
}

export async function onRequestGet(context) {
    const { env } = context;

    const auth = await authenticateAdmin(context);
    if (!auth.success) {
        const status = auth.status || 401;
        const error = status === 403 ? 'Forbidden' : 'Unauthorized';
        return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const rows = await env.DB.prepare(
            'SELECT id, email, username as name, is_admin, created_at FROM users ORDER BY id ASC'
        ).all();

        return new Response(JSON.stringify({ users: rows.results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Get users error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;

    const auth = await authenticateAdmin(context);
    if (!auth.success) {
        const status = auth.status || 401;
        const error = status === 403 ? 'Forbidden' : 'Unauthorized';
        return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 자기 자신 삭제 방지
        if (parseInt(userId) === context.user.userId) {
            return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 관련 데이터 삭제
        await env.DB.prepare('DELETE FROM assignments WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM study_records WHERE user_id = ?').bind(userId).run();

        // 사용자 삭제
        const result = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true, message: 'User deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Delete user error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;

    const auth = await authenticateAdmin(context);
    if (!auth.success) {
        const status = auth.status || 401;
        const error = status === 403 ? 'Forbidden' : 'Unauthorized';
        return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        const { userId, is_admin, new_password } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 관리자 권한 변경
        if (typeof is_admin !== 'undefined') {
            if (parseInt(userId) === context.user.userId && !is_admin) {
                return new Response(JSON.stringify({ error: 'Cannot remove your own admin rights' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            await env.DB.prepare('UPDATE users SET is_admin = ? WHERE id = ?').bind(is_admin ? 1 : 0, userId).run();
        }

        // 비밀번호 재설정
        if (new_password) {
            if (new_password.length < 4) {
                return new Response(JSON.stringify({ error: 'Password must be at least 4 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(new_password));
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hashHex, userId).run();
        }

        const user = await env.DB.prepare('SELECT id, email, username as name, is_admin FROM users WHERE id = ?').bind(userId).first();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true, user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Update user error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// POST: 사용자 추가
export async function onRequestPost(context) {
    const { request, env } = context;

    const auth = await authenticateAdmin(context);
    if (!auth.success) {
        const status = auth.status || 401;
        const error = status === 403 ? 'Forbidden' : 'Unauthorized';
        return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
            return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        const result = await env.DB.prepare(
            'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
        ).bind(email, name || email.split('@')[0], hashHex).run();

        const user = { id: result.meta.last_row_id, email, name: name || email.split('@')[0] };
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
