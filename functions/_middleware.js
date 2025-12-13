// Cloudflare Pages Functions - 인증 미들웨어
// JWT 토큰 검증

export async function onRequest(context) {
  const { request, next, env } = context;

  // 인증이 필요 없는 경로
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/',
    '/index.html',
    '/favicon.ico',
    '/manifest.json',
    '/static/',
    '/service-worker.js',
    '/precache-manifest'
  ];
  const url = new URL(request.url);

  // 정적 파일이나 공개 경로는 인증 없이 통과
  if (publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path))) {
    return next();
  }

  // API 경로가 아니면 통과 (정적 파일)
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);

  try {
    // JWT 검증
    const payload = await verifyJWT(token, env.JWT_SECRET);

    // 사용자 정보를 context에 추가
    context.user = payload;

    return next();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token', details: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// JWT 검증 함수 (수정된 버전)
async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Base64 URL 디코딩
  const base64urlDecode = (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  };

  // Payload 디코딩
  const payload = JSON.parse(base64urlDecode(payloadB64));

  // 만료 시간 확인
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  // 서명 검증
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // 서명을 바이트 배열로 변환
  const signatureBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));

  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  return payload;
}
