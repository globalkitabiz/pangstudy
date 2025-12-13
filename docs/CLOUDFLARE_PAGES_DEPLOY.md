# Cloudflare Pages 배포 가이드

## ✅ 완료된 작업
- GitHub 저장소 생성: https://github.com/globalkitabiz/pangstudy
- 코드 푸시 완료 (100 files, 35,973 insertions)
- 로컬 D1 데이터베이스 설정 완료

---

## 🚀 Cloudflare Pages 배포 단계

### 1단계: Cloudflare Dashboard 접속

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** 메뉴 클릭
3. **Create application** 버튼 클릭
4. **Pages** 탭 선택
5. **Connect to Git** 클릭

### 2단계: GitHub 저장소 연결

1. **GitHub** 선택
2. 저장소 목록에서 **globalkitabiz/pangstudy** 선택
3. **Begin setup** 클릭

### 3단계: 빌드 설정

다음 설정을 입력하세요:

**Project name**: `pangstudy` (또는 원하는 이름)

**Production branch**: `main`

**Build settings**:
- **Framework preset**: None
- **Build command**:
  ```
  cd client && npm install --legacy-peer-deps && npm run build
  ```
- **Build output directory**:
  ```
  client/build
  ```
- **Root directory**: `/` (비워두기)

### 4단계: 환경 변수 설정

**Environment variables** 섹션에서 **Add variable** 클릭:

1. **JWT_SECRET**
   - Value: 강력한 랜덤 문자열 (예: `your-super-secret-jwt-key-change-this-in-production-32chars`)
   - 32자 이상 권장

2. **NODE_OPTIONS**
   - Value: `--openssl-legacy-provider`
   - (Node.js 버전 호환성을 위해 필요)

### 5단계: 배포 시작

1. **Save and Deploy** 버튼 클릭
2. 빌드 진행 상황 확인 (약 2-5분 소요)
3. 빌드 완료 대기

---

## 🗄️ D1 데이터베이스 바인딩

배포가 완료된 후 D1 데이터베이스를 연결해야 합니다:

### 1단계: Pages 프로젝트 설정 이동

1. 배포된 프로젝트 페이지에서 **Settings** 탭 클릭
2. **Functions** 메뉴 클릭

### 2단계: D1 바인딩 추가

1. **D1 database bindings** 섹션 찾기
2. **Add binding** 클릭
3. 다음 정보 입력:
   - **Variable name**: `DB`
   - **D1 database**: `pangstudy-db` 선택
4. **Save** 클릭

### 3단계: 프로덕션 데이터베이스 마이그레이션

로컬 터미널에서 실행:
```bash
cd C:\win_asp_LMs\pangstudy
wrangler d1 execute pangstudy-db --file=./migrations/0001_initial.sql --remote
```

이 명령은 프로덕션 D1 데이터베이스에 테이블을 생성합니다.

### 4단계: 재배포

D1 바인딩을 추가한 후:
1. **Deployments** 탭으로 이동
2. **Retry deployment** 클릭 (또는 GitHub에 새 커밋 푸시)

---

## 🎉 배포 완료 확인

### 배포 URL 확인

배포가 완료되면 Cloudflare가 제공하는 URL을 확인하세요:
- 예: `https://pangstudy.pages.dev`
- 또는 커스텀 도메인 설정 가능

### 테스트

1. 배포된 URL 접속
2. 회원가입 테스트
3. 로그인 테스트
4. 덱 생성 테스트
5. 카드 추가 테스트

---

## 🔧 문제 해결

### 빌드 실패 시

**로그 확인**:
1. Deployments 탭에서 실패한 배포 클릭
2. 빌드 로그 확인

**일반적인 문제**:
- `NODE_OPTIONS` 환경 변수 누락
- 빌드 명령어 오타
- 빌드 출력 디렉토리 경로 오류

### API 호출 오류 시

**D1 바인딩 확인**:
1. Settings → Functions → D1 database bindings
2. `DB` 바인딩이 `pangstudy-db`에 연결되어 있는지 확인

**프로덕션 마이그레이션 확인**:
```bash
wrangler d1 execute pangstudy-db --command="SELECT name FROM sqlite_master WHERE type='table'" --remote
```

테이블 목록이 표시되어야 합니다: users, decks, cards, reviews

---

## 📝 추가 설정 (선택사항)

### 커스텀 도메인 연결

1. **Custom domains** 탭 클릭
2. **Set up a custom domain** 클릭
3. 도메인 입력 및 DNS 설정

### 자동 배포 설정

- GitHub의 `main` 브랜치에 푸시할 때마다 자동 배포됩니다
- Pull Request 시 미리보기 배포도 자동 생성됩니다

---

## 🎊 성공!

모든 설정이 완료되면 전 세계 어디서나 접속 가능한 Anki 스타일 학습 앱이 준비됩니다!

**GitHub**: https://github.com/globalkitabiz/pangstudy
**Cloudflare Pages**: 배포 후 URL 확인

축하합니다! 🚀
