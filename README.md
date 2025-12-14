# 🎴 Pangstudy

Anki 스타일의 간격 반복 학습 애플리케이션입니다. SM-2 알고리즘을 사용하여 효율적인 암기 학습을 지원합니다.

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pangstudy.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ 주요 기능

### 📚 덱 관리
- ✅ 덱 생성, 수정, 삭제
- ✅ 덱 검색 및 정렬 (이름순, 최신순, 카드 수)
- ✅ 덱 공유 (링크 생성 및 가져오기)
- ✅ Anki .apkg 파일 가져오기 (예정)

### 🃏 카드 관리
- ✅ 카드 생성, 수정, 삭제
- ✅ 앞면/뒷면 텍스트 지원
- ✅ 이미지 첨부 (예정)

### 🧠 학습 기능
- ✅ SM-2 알고리즘 기반 간격 반복
- ✅ 4단계 난이도 선택 (다시, 어려움, 보통, 쉬움)
- ✅ 학습 진행률 추적
- ✅ 학습 통계 대시보드

### 👤 사용자 기능
- ✅ 회원가입 / 로그인
- ✅ JWT 기반 인증
- ✅ 개인별 덱 관리

### 🎨 UX/UI
- ✅ 반응형 디자인
- ✅ 실시간 검색
- ✅ 로딩 스피너
- ✅ 사용자 친화적 에러 메시지
- 🔜 다크 모드
- 🔜 키보드 단축키

---

## 🚀 빠른 시작

### 1. 회원가입
https://pangstudy.pages.dev 접속 → 회원가입

### 2. 덱 생성
"+ 새 덱 만들기" 버튼 클릭 → 덱 이름 입력

### 3. 카드 추가
덱 클릭 → "+ 새 카드 추가" → 앞면/뒷면 입력

### 4. 학습 시작
"📚 학습 시작" 버튼 클릭 → 카드 학습

---

## 🛠️ 기술 스택

### Frontend
- **React** 16.6.3 (Class Components)
- **React Router** 4.x
- **Vanilla CSS** (인라인 스타일)

### Backend
- **Cloudflare Workers** (Serverless)
- **Cloudflare D1** (SQLite)
- **Cloudflare Pages** (호스팅)

### 인증
- **JWT** (HMAC SHA-256)

### 배포
- **GitHub Actions** (자동 배포)

---

## 📖 사용 가이드

### 덱 검색
검색창에 덱 이름 또는 설명 입력 → 실시간 필터링

### 덱 정렬
드롭다운에서 선택:
- **최신순**: 최근 생성된 덱부터
- **이름순**: 가나다순
- **카드 수**: 카드가 많은 덱부터

### 덱 공유
1. 덱 상세 페이지 → "📤 이 덱 공유하기"
2. 공유 링크 복사
3. 친구에게 전달

### 공유된 덱 가져오기
1. 덱 목록 → "📥 공유된 덱 받기"
2. 공유 링크 또는 토큰 입력
3. "가져오기" 클릭

### 학습 방법
1. 덱 선택 → "📚 학습 시작"
2. 카드 앞면 확인 → "답변 보기"
3. 난이도 선택:
   - **다시**: 10분 후 다시 학습
   - **어려움**: 1일 후
   - **보통**: 3일 후
   - **쉬움**: 7일 후

---

## 🏗️ 로컬 개발

### 필수 요구사항
- Node.js 16+
- Cloudflare 계정
- Wrangler CLI

### 설치
```bash
# 저장소 클론
git clone https://github.com/globalkitabiz/pangstudy.git
cd pangstudy

# 클라이언트 의존성 설치
cd client
npm install

# 루트로 돌아가기
cd ..
```

### 환경 설정
```bash
# D1 데이터베이스 생성
wrangler d1 create pangstudy-db

# 마이그레이션 실행
wrangler d1 execute pangstudy-db --file=migrations/0001_initial.sql --remote
wrangler d1 execute pangstudy-db --file=migrations/0002_shared_decks.sql --remote
wrangler d1 execute pangstudy-db --file=migrations/0003_reviews_update.sql --remote

# JWT_SECRET 설정
wrangler secret put JWT_SECRET
# 강력한 랜덤 문자열 입력 (32자 이상)
```

### 로컬 실행
```bash
# 클라이언트 빌드
cd client
npm run build

# 개발 서버 실행
cd ..
wrangler pages dev client/build
```

### 배포
```bash
# GitHub에 푸시하면 자동 배포
git add .
git commit -m "Update"
git push origin main
```

---

## 📊 데이터베이스 스키마

### users
- id, email, password_hash, username, created_at

### decks
- id, user_id, name, description, created_at, updated_at

### cards
- id, deck_id, front, back, created_at, updated_at

### reviews
- id, card_id, user_id, difficulty, next_review_date, interval_days, ease_factor, repetitions, reviewed_at

### shared_decks
- id, deck_id, share_token, created_at

---

## 🔐 보안

### JWT 인증
- HMAC SHA-256 서명
- Bearer 토큰 방식
- 환경변수로 시크릿 관리

### 비밀번호
- SHA-256 해싱
- 클라이언트 측 해싱

### 데이터 접근
- 사용자별 덱/카드 격리
- 소유권 검증

---

## 📝 개발 진행 상황

### ✅ 완료 (53%)
- [x] 1주차: 긴급 수정 및 기본 기능 개선
  - [x] 로그인/회원가입 리다이렉션
  - [x] JWT_SECRET 보안 강화
  - [x] 카드 편집 API
  - [x] Reviews 마이그레이션

- [x] 2주차: UX 개선 및 검색 기능
  - [x] 덱 검색 기능
  - [x] 덱 정렬 기능
  - [x] 에러 처리 개선
  - [x] 로딩 스피너

### 🔜 예정 (47%)
- [ ] 3주차: 학습 경험 향상
  - [ ] 학습 진행률 시각화
  - [ ] 다크 모드
  - [ ] 키보드 단축키

- [ ] 4주차: 고급 기능 및 최적화
  - [ ] CSV 일괄 가져오기
  - [ ] 페이지네이션
  - [ ] API 캐싱

---

## 🐛 알려진 이슈

- [ ] Anki .apkg 파일 가져오기 미구현
- [ ] 이미지 첨부 기능 미구현 (Cloudflare R2 설정 필요)
- [ ] 모바일 최적화 필요

---

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

---

## 📞 문의

프로젝트 링크: https://github.com/globalkitabiz/pangstudy

---

## 🙏 감사의 말

- [Anki](https://apps.ankiweb.net/) - 영감을 준 원본 애플리케이션
- [Cloudflare](https://www.cloudflare.com/) - 인프라 제공
- [React](https://reactjs.org/) - UI 프레임워크

---

## 📚 문서

- [개발 계획표](docs/implementation_plan.md)
- [작업 체크리스트](docs/task.md)
- [개선 제안](docs/improvement_suggestions.md)
- [1주차 완료 보고서](docs/week1_completion.md)
- [2주차 완료 보고서](docs/week2_completion.md)
- [Cloudflare 설정 가이드](docs/CLOUDFLARE_SETUP.md)
- [배포 가이드](docs/CLOUDFLARE_PAGES_DEPLOY.md)