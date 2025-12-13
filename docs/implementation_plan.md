# Anki 웹 클론 프로젝트 구현 계획

## 목표 설명

기존 오픈소스 프로젝트 `alexabush/anki-clone`을 기반으로 Anki 스타일의 웹 앱을 구축합니다. 이 프로젝트는 간격 반복 학습(Spaced Repetition) 알고리즘을 사용한 플래시카드 앱으로, **Anki 덱(.apkg 파일) 가져오기 기능**을 추가하여 기존 Anki 사용자들이 자신의 학습 자료를 쉽게 이전할 수 있도록 합니다.

### 프로젝트 정보

- **프로젝트 루트 경로**: `C:\win_asp_LMs\pangstudy`
- **모든 소스 코드**: 이 경로에서 개발
- **모든 문서**: 이 경로에 저장
- **기반 프로젝트**: `alexabush/anki-clone` (GitHub에서 클론)
- **배포 인프라**: Cloudflare (Pages + Workers + D1)
- **소스 관리**: GitHub (자동 배포 연동)

## 사용자 검토 필요 사항

> [!NOTE]
> **자동 진행**: 이 계획서가 승인되면 별도 확인 없이 바로 구현 작업을 시작합니다. 각 단계별로 자동으로 진행되며, 중요한 결정이 필요한 경우에만 사용자에게 문의합니다.

> [!IMPORTANT]
> **Cloudflare 인프라 사용**: 무료 티어로 강력한 기능 제공
> - **Cloudflare Pages**: 프론트엔드 호스팅 (무제한 요청)
> - **Cloudflare Workers**: 서버리스 백엔드 (하루 100,000 요청 무료)
> - **Cloudflare D1**: SQLite 기반 서버리스 데이터베이스 (무료 티어: 5GB 저장, 하루 500만 읽기)
> - **GitHub 연동**: 코드 푸시 시 자동 배포

> [!IMPORTANT]
> **사용자 인증 시스템**: 각 사용자의 학습 진행도를 개별 저장
> - 이메일/비밀번호 로그인
> - 소셜 로그인 (Google, GitHub) - 선택사항
> - JWT 토큰 기반 인증

> [!WARNING]
> **기존 프로젝트 구조 변경**: 
> - PostgreSQL → Cloudflare D1 (SQLite)
> - Express 서버 → Cloudflare Workers
> - 기존 코드를 Cloudflare 환경에 맞게 마이그레이션 필요

---

## 제안 변경 사항

### 1단계: 프로젝트 클론 및 초기 설정

#### [NEW] 프로젝트 디렉토리 구조
```
C:\win_asp_LMs\pangstudy\
├── client/                      # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── Auth/          # 로그인/회원가입
│   │   │   ├── Deck/          # 덱 관리
│   │   │   ├── Card/          # 카드 관리
│   │   │   └── Study/         # 학습 화면
│   │   ├── utils/             # 유틸리티 함수
│   │   │   ├── ankiImporter.js  # Anki 덱 파싱
│   │   │   └── api.js           # API 호출
│   │   ├── i18n/              # 다국어 지원 (한국어)
│   │   └── contexts/          # React Context (인증 등)
│   └── package.json
├── functions/                   # Cloudflare Pages Functions (Workers)
│   ├── api/
│   │   ├── auth/              # 인증 API
│   │   ├── decks/             # 덱 관리 API
│   │   ├── cards/             # 카드 관리 API
│   │   └── study/             # 학습 기록 API
│   └── _middleware.js         # 인증 미들웨어
├── migrations/                  # D1 데이터베이스 마이그레이션
│   └── 0001_initial.sql
├── docs/                        # 프로젝트 문서
│   ├── implementation_plan.md
│   ├── task.md
│   └── README.md
├── wrangler.toml               # Cloudflare 설정
├── package.json
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Actions (선택사항)
```

#### 초기 설정 작업

**1. Git 저장소 클론**
```bash
cd C:\win_asp_LMs\pangstudy
git clone https://github.com/alexabush/anki-clone.git .
```

**2. Cloudflare CLI 설치**
```bash
npm install -g wrangler
wrangler login
```

**3. 의존성 설치**
```bash
npm install
cd client
npm install
npm install anki-reader  # Anki 덱 파싱 라이브러리
```

**4. Cloudflare D1 데이터베이스 생성**
```bash
wrangler d1 create pangstudy-db
# 출력된 database_id를 wrangler.toml에 추가
```

---

### 2단계: 데이터베이스 스키마 설계 (Cloudflare D1)

#### [NEW] `migrations/0001_initial.sql`
D1은 SQLite 기반이므로 기존 PostgreSQL 스키마를 SQLite로 변환합니다.

**주요 테이블**:
```sql
-- 사용자 테이블
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 덱 테이블
CREATE TABLE decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 카드 테이블
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deck_id) REFERENCES decks(id)
);

-- 학습 기록 테이블 (간격 반복 알고리즘)
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,  -- 1: Again, 2: Hard, 3: Good, 4: Easy
  next_review_date DATETIME NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor REAL DEFAULT 2.5,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_reviews_card ON reviews(card_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_next_date ON reviews(next_review_date);
```

**마이그레이션 실행**:
```bash
wrangler d1 execute pangstudy-db --file=./migrations/0001_initial.sql
```

---

### 3단계: Cloudflare Workers API 구축

#### [NEW] `wrangler.toml`
Cloudflare 프로젝트 설정 파일

```toml
name = "pangstudy"
compatibility_date = "2024-01-01"

# Pages 설정
pages_build_output_dir = "client/build"

# D1 데이터베이스 바인딩
[[d1_databases]]
binding = "DB"
database_name = "pangstudy-db"
database_id = "YOUR_DATABASE_ID"  # wrangler d1 create 명령 실행 후 받은 ID

# 환경 변수
[vars]
JWT_SECRET = "your-secret-key-here"  # 프로덕션에서는 Cloudflare Secrets 사용
```

#### [NEW] `functions/api/auth/login.js`
로그인 API 엔드포인트

```javascript
import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, password } = await request.json();

  // 사용자 조회
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return new Response('Invalid credentials', { status: 401 });
  }

  // JWT 토큰 생성
  const token = await jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email } }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### [NEW] `functions/api/auth/register.js`
회원가입 API

#### [NEW] `functions/api/decks/index.js`
덱 목록 조회 및 생성 API

#### [NEW] `functions/api/cards/[deckId].js`
특정 덱의 카드 관리 API

#### [NEW] `functions/_middleware.js`
JWT 인증 미들웨어

---

### 4단계: Anki 덱 가져오기 기능 추가

#### [NEW] `client/src/utils/ankiImporter.js`
브라우저에서 `.apkg` 파일 파싱

```javascript
import { readAnkiPackage } from 'anki-reader';

export async function importAnkiDeck(file) {
  try {
    // .apkg 파일 읽기
    const arrayBuffer = await file.arrayBuffer();
    const { collection, media } = await readAnkiPackage(arrayBuffer);
    
    // 덱 정보 추출
    const decks = extractDecks(collection);
    const cards = extractCards(collection);
    
    return { decks, cards, media };
  } catch (error) {
    console.error('Anki import error:', error);
    throw error;
  }
}

function extractDecks(collection) {
  // collection 객체에서 덱 정보 추출
  // Anki 데이터 구조에 맞게 파싱
}

function extractCards(collection) {
  // collection 객체에서 카드 정보 추출
}
```

#### [NEW] `client/src/components/ImportDeck.jsx`
덱 가져오기 UI 컴포넌트

```jsx
import React, { useState } from 'react';
import { importAnkiDeck } from '../utils/ankiImporter';
import { uploadDeck } from '../utils/api';

export function ImportDeck() {
  const [uploading, setUploading] = useState(false);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { decks, cards, media } = await importAnkiDeck(file);
      await uploadDeck(decks, cards, media);
      alert('덱 가져오기 성공!');
    } catch (error) {
      alert('덱 가져오기 실패: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="import-deck">
      <h2>Anki 덱 가져오기</h2>
      <input 
        type="file" 
        accept=".apkg" 
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>가져오는 중...</p>}
    </div>
  );
}
```

---

### 5단계: 한국어 지원 추가

#### [NEW] `client/src/i18n/ko.json`
```json
{
  "auth": {
    "login": "로그인",
    "register": "회원가입",
    "email": "이메일",
    "password": "비밀번호",
    "logout": "로그아웃"
  },
  "deck": {
    "myDecks": "내 덱",
    "createDeck": "새 덱 만들기",
    "importDeck": "덱 가져오기",
    "deckName": "덱 이름"
  },
  "study": {
    "startStudy": "학습 시작",
    "again": "다시",
    "hard": "어려움",
    "good": "좋음",
    "easy": "쉬움",
    "showAnswer": "답 보기"
  }
}
```

---

### 6단계: GitHub 연동 및 자동 배포

#### [NEW] `.github/workflows/deploy.yml` (선택사항)
GitHub Actions를 통한 자동 배포

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd client && npm install
      
      - name: Build
        run: cd client && npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy client/build --project-name=pangstudy
```

#### Cloudflare Dashboard 설정
1. **Cloudflare 대시보드** 접속: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. GitHub 저장소 연결
4. 빌드 설정:
   - Build command: `cd client && npm install && npm run build`
   - Build output directory: `client/build`
5. D1 데이터베이스 바인딩 추가

---

## 검증 계획

### 자동화 테스트

#### 1. 로컬 개발 환경 테스트
```bash
# Cloudflare Workers 로컬 실행
wrangler pages dev client/build --d1 DB=pangstudy-db

# 브라우저에서 http://localhost:8788 접속
```

#### 2. API 엔드포인트 테스트
```bash
# 회원가입 테스트
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 로그인 테스트
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 수동 검증

#### 1. 회원가입 및 로그인
- 회원가입 페이지에서 계정 생성
- 로그인 성공 확인
- JWT 토큰 저장 확인

#### 2. 덱 관리
- 새 덱 생성
- 덱 목록 조회
- 덱 삭제

#### 3. Anki 덱 가져오기
- 샘플 `.apkg` 파일 준비
- 파일 업로드
- 가져온 덱 및 카드 확인
- 이미지/오디오 미디어 파일 확인

#### 4. 학습 기능
- 학습 세션 시작
- 카드 플립 (앞면 → 뒷면)
- 난이도 선택 (Again/Hard/Good/Easy)
- 다음 복습 날짜 계산 확인
- 학습 진행도 저장 확인

#### 5. 배포 확인
- GitHub에 코드 푸시
- Cloudflare Pages 자동 배포 확인
- 프로덕션 URL 접속 테스트
- 모든 기능 정상 작동 확인

#### 6. 다중 사용자 테스트
- 여러 계정 생성
- 각 사용자의 데이터가 독립적으로 저장되는지 확인
- 로그아웃 후 다른 계정으로 로그인

---

## 다음 단계

> [!NOTE]
> **자동 진행 모드**: 승인 후 아래 단계들을 순차적으로 자동 실행합니다.

1. **프로젝트 클론**: GitHub에서 저장소 클론
2. **Cloudflare 설정 안내**: D1 데이터베이스 생성 방법 제시
3. **백엔드 구현**: Workers API 엔드포인트 자동 개발
4. **프론트엔드 수정**: React 앱을 Cloudflare 환경에 맞게 자동 수정
5. **Anki 가져오기**: anki-reader 통합 자동 구현
6. **한국어 지원**: i18n 자동 추가
7. **로컬 테스트**: 테스트 명령어 제공
8. **배포 준비**: GitHub 연동 및 자동 배포 설정 안내

**중요**: 각 단계는 자동으로 진행되며, Cloudflare API 키 등 사용자 입력이 필요한 경우에만 문의합니다.
