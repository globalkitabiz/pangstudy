# Pangstudy - Cloudflare 설정 가이드

## 1. Cloudflare 계정 설정

1. https://dash.cloudflare.com 에서 로그인
2. 계정이 없다면 무료 계정 생성

## 2. Wrangler CLI 설치

```bash
npm install -g wrangler
wrangler login
```

## 3. D1 데이터베이스 생성

```bash
cd C:\win_asp_LMs\pangstudy
wrangler d1 create pangstudy-db
```

출력된 `database_id`를 복사하여 `wrangler.toml` 파일의 `database_id` 필드에 붙여넣기:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pangstudy-db"
database_id = "여기에_복사한_ID_붙여넣기"
```

## 4. 데이터베이스 마이그레이션 실행

```bash
wrangler d1 execute pangstudy-db --file=./migrations/0001_initial.sql
```

## 5. 로컬 개발 서버 실행

### 클라이언트 빌드
```bash
cd client
npm install
npm run build
cd ..
```

### Cloudflare Pages 로컬 실행
```bash
wrangler pages dev client/build --d1 DB=pangstudy-db
```

브라우저에서 `http://localhost:8788` 접속

## 6. GitHub 저장소 생성 및 푸시

```bash
git init
git add .
git commit -m "Initial commit: Pangstudy Anki clone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pangstudy.git
git push -u origin main
```

## 7. Cloudflare Pages 배포

1. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git
2. GitHub 저장소 선택: `pangstudy`
3. 빌드 설정:
   - Build command: `cd client && npm install && npm run build`
   - Build output directory: `client/build`
   - Root directory: `/`
4. Environment variables 추가:
   - `JWT_SECRET`: 강력한 랜덤 문자열 (프로덕션용)
5. D1 데이터베이스 바인딩:
   - Settings → Functions → D1 database bindings
   - Variable name: `DB`
   - D1 database: `pangstudy-db`
6. Save and Deploy

## 8. 배포 확인

배포 완료 후 제공된 URL (예: `https://pangstudy.pages.dev`)로 접속하여 테스트

## 주요 명령어 요약

```bash
# 로컬 개발
wrangler pages dev client/build --d1 DB=pangstudy-db

# D1 데이터베이스 쿼리 (디버깅용)
wrangler d1 execute pangstudy-db --command="SELECT * FROM users"

# 프로덕션 배포 (GitHub 푸시로 자동 배포됨)
git push origin main
```

## 문제 해결

### D1 데이터베이스 연결 오류
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Dashboard에서 D1 바인딩이 설정되었는지 확인

### 빌드 오류
- `client/package.json`의 의존성이 모두 설치되었는지 확인
- Node.js 버전 확인 (v16 이상 권장)

### API 호출 오류
- 브라우저 개발자 도구 → Network 탭에서 요청/응답 확인
- JWT 토큰이 올바르게 전달되는지 확인
