# Pangstudy - Anki 스타일 웹 학습 앱

> 간격 반복 학습(Spaced Repetition) 알고리즘을 사용한 플래시카드 웹 애플리케이션

## 📋 프로젝트 개요

이 프로젝트는 `alexabush/anki-clone`을 기반으로 한 Anki 스타일의 웹 앱입니다. Anki 덱(.apkg 파일) 가져오기 기능을 추가하여 기존 Anki 사용자들이 자신의 학습 자료를 쉽게 이전할 수 있습니다.

## 🎯 주요 기능

- ✅ **사용자 인증** - 로그인/회원가입으로 개인 학습 데이터 저장
- ✅ 간격 반복 학습 알고리즘 (Spaced Repetition)
- ✅ 덱(Deck) 및 카드 관리
- ✅ **Anki 덱(.apkg) 가져오기 지원**
- ✅ **한국어 인터페이스**
- ✅ 학습 진행도 추적
- ✅ 반응형 디자인
- ✅ **GitHub 자동 배포**

## 🛠️ 기술 스택

### 프론트엔드
- React (Create React App)
- React Router
- React Bootstrap

### 백엔드 및 인프라
- **Cloudflare Pages** - 프론트엔드 호스팅 (무료)
- **Cloudflare Workers** - 서버리스 API (하루 100,000 요청 무료)
- **Cloudflare D1** - SQLite 기반 서버리스 데이터베이스 (5GB 무료)
- JWT 인증 (사용자 로그인)

### 추가 라이브러리
- `anki-reader` - Anki 덱 파싱

## 📁 프로젝트 구조

```
C:\win_asp_LMs\pangstudy\
├── client/                      # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── Auth/          # 로그인/회원가입
│   │   │   └── ImportDeck/    # Anki 덱 가져오기
│   │   ├── utils/             # 유틸리티 함수
│   │   ├── i18n/              # 한국어 지원
│   │   └── contexts/          # React Context
│   └── package.json
├── functions/                   # Cloudflare Pages Functions
│   ├── api/
│   │   ├── auth/              # 인증 API
│   │   ├── decks/             # 덱 관리 API
│   │   └── cards/             # 카드 관리 API
│   └── _middleware.js         # JWT 인증 미들웨어
├── migrations/                  # D1 데이터베이스 마이그레이션
├── docs/                        # 프로젝트 문서
│   ├── CLOUDFLARE_SETUP.md    # Cloudflare 설정 가이드
│   ├── implementation_plan.md
│   └── task.md
├── wrangler.toml               # Cloudflare 설정
└── package.json
```

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn
- Cloudflare 계정 (무료)

### 설치 방법

#### 1. 의존성 설치

```bash
cd C:\win_asp_LMs\pangstudy

# 클라이언트 의존성
cd client
npm install
cd ..
```

#### 2. Cloudflare 설정

**Wrangler CLI 설치 및 로그인**
```bash
npm install -g wrangler
wrangler login
```

**D1 데이터베이스 생성**
```bash
wrangler d1 create pangstudy-db
```

출력된 `database_id`를 `wrangler.toml` 파일에 추가:
```toml
[[d1_databases]]
binding = "DB"
database_name = "pangstudy-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

**데이터베이스 마이그레이션 실행**
```bash
wrangler d1 execute pangstudy-db --file=./migrations/0001_initial.sql
```

#### 3. 로컬 실행

**클라이언트 빌드**
```bash
cd client
npm run build
cd ..
```

**Cloudflare Pages 로컬 개발 서버**
```bash
wrangler pages dev client/build --d1 DB=pangstudy-db
```

브라우저에서 `http://localhost:8788` 접속

## 🌐 배포하기

### GitHub 저장소 생성

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pangstudy.git
git push -u origin main
```

### Cloudflare Pages 배포

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. GitHub 저장소 선택: `pangstudy`
4. **빌드 설정**:
   - Build command: `cd client && npm install && npm run build`
   - Build output directory: `client/build`
5. **Environment variables** 추가:
   - `JWT_SECRET`: 강력한 랜덤 문자열
6. **D1 데이터베이스 바인딩**:
   - Settings → Functions → D1 database bindings
   - Variable name: `DB`
   - D1 database: `pangstudy-db`
7. **Save and Deploy**

자세한 설정 가이드는 [CLOUDFLARE_SETUP.md](./docs/CLOUDFLARE_SETUP.md)를 참조하세요.

## 📚 사용 방법

### 1. 회원가입 / 로그인
- 앱 접속 후 회원가입
- 이메일과 비밀번호로 로그인

### 2. 새 덱 생성
- "새 덱 만들기" 버튼 클릭
- 덱 이름 입력

### 3. Anki 덱 가져오기
- "덱 가져오기" 버튼 클릭
- `.apkg` 파일 선택 또는 드래그 앤 드롭
- 가져오기 완료 대기

### 4. 카드 추가
- 덱 선택
- "카드 추가" 버튼 클릭
- 앞면(질문)과 뒷면(답변) 입력

### 5. 학습 시작
- 학습할 덱 선택
- "학습 시작" 버튼 클릭
- 카드를 보고 난이도 선택:
  - **다시**: 다시 학습 (짧은 간격)
  - **어려움**: 어려움 (중간 간격)
  - **좋음**: 좋음 (표준 간격)
  - **쉬움**: 쉬움 (긴 간격)

## 📖 문서

- [구현 계획서](./docs/implementation_plan.md)
- [Cloudflare 설정 가이드](./docs/CLOUDFLARE_SETUP.md)
- [작업 체크리스트](./docs/task.md)

## 🔧 개발

### 주요 명령어

```bash
# 로컬 개발 서버
wrangler pages dev client/build --d1 DB=pangstudy-db

# 클라이언트 빌드
cd client && npm run build

# D1 데이터베이스 쿼리 (디버깅)
wrangler d1 execute pangstudy-db --command="SELECT * FROM users"
```

### 프로젝트 구조

- `functions/` - Cloudflare Pages Functions (서버리스 API)
- `client/` - React 프론트엔드
- `migrations/` - D1 데이터베이스 스키마
- `docs/` - 프로젝트 문서

## 💰 비용

**완전 무료!** (Cloudflare 무료 티어 사용)
- Pages: 무제한 요청
- Workers: 하루 100,000 요청
- D1: 5GB 저장, 하루 500만 읽기

## 🤝 기여

이 프로젝트는 개인 학습용 프로젝트입니다.

## 📄 라이선스

원본 프로젝트 라이선스를 따릅니다.

## 🙏 감사의 말

- [alexabush/anki-clone](https://github.com/alexabush/anki-clone) - 기반 프로젝트
- [Anki](https://apps.ankiweb.net/) - 영감을 준 원본 앱
- [anki-reader](https://github.com/chenlijun99/anki-reader) - Anki 덱 파싱 라이브러리
- [Cloudflare](https://www.cloudflare.com/) - 무료 인프라 제공

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.