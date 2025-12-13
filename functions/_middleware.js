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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);

  try {
    // JWT 검증 (간단한 구현, 프로덕션에서는 라이브러리 사용)
    const payload = await verifyJWT(token, env.JWT_SECRET);

    // 사용자 정보를 context에 추가
    context.user = payload;

    return next();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 간단한 JWT 검증 함수 (실제로는 라이브러리 사용 권장)
async function verifyJWT(token, secret) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');

  // Payload 디코딩
  const payload = JSON.parse(atob(payloadB64));

  // 만료 시간 확인
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  // 실제 프로덕션에서는 서명 검증 필요
  // 여기서는 간단히 payload만 반환
  return payload;
}
