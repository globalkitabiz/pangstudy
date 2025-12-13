# Anki 웹 클론 프로젝트 구현 계획

## 목표 설명

기존 오픈소스 프로젝트 `alexabush/anki-clone`을 기반으로 Anki 스타일의 웹 앱을 구축합니다. 이 프로젝트는 간격 반복 학습(Spaced Repetition) 알고리즘을 사용한 플래시카드 앱으로, **Anki 덱(.apkg 파일) 가져오기 기능**을 추가하여 기존 Anki 사용자들이 자신의 학습 자료를 쉽게 이전할 수 있도록 합니다.

## 사용자 검토 필요 사항

> [!IMPORTANT]
> **기술 스택 변경 여부**: 원본 프로젝트는 PostgreSQL + Sequelize를 사용하지만, 더 간단한 배포를 위해 **IndexedDB** 또는 **SQLite (sql.js)**로 변경할 수 있습니다. 백엔드 없이 순수 프론트엔드 앱으로 만들 수도 있습니다.

> [!IMPORTANT]
> **Anki 덱 가져오기**: `anki-reader` 라이브러리를 사용하여 `.apkg` 파일을 파싱합니다. 이 기능은 브라우저에서 직접 작동하며 서버가 필요하지 않습니다.

> [!WARNING]
> **데이터베이스 선택**: 
> - **옵션 A**: 기존 PostgreSQL 유지 (서버 필요)
> - **옵션 B**: IndexedDB로 변경 (브라우저 로컬 저장, 서버 불필요)
> - **옵션 C**: SQLite (sql.js) 사용 (브라우저에서 SQLite 실행)
> 
> 어떤 옵션을 선호하시나요?

---

## 제안 변경 사항

### 1단계: 프로젝트 클론 및 초기 설정

#### [NEW] 프로젝트 디렉토리
- `C:\win_asp_LMs\pangstudy`에 프로젝트 클론
- GitHub 저장소: `https://github.com/alexabush/anki-clone`

#### 초기 설정 작업
1. Git 저장소 클론
2. 서버 의존성 설치 (`npm install`)
3. 클라이언트 의존성 설치 (`cd client && npm install`)
4. 데이터베이스 설정 (PostgreSQL 또는 대안)

---

### 2단계: Anki 덱 가져오기 기능 추가

#### [NEW] `client/src/utils/ankiImporter.js`
- `anki-reader` 라이브러리를 사용하여 `.apkg` 파일 파싱
- 덱, 카드, 미디어 파일 추출
- 기존 데이터베이스 스키마에 맞게 변환

**주요 기능**:
```javascript
- readAnkiPackage(file) // .apkg 파일 읽기
- extractDecks(collection) // 덱 정보 추출
- extractCards(collection) // 카드 정보 추출
- importToDatabase(decks, cards) // DB에 저장
```

#### [MODIFY] `client/package.json`
- `anki-reader` 의존성 추가
- `sql.js` 의존성 추가 (브라우저에서 SQLite 사용)

#### [NEW] `client/src/components/ImportDeck.jsx`
- 파일 업로드 UI 컴포넌트
- 드래그 앤 드롭 지원
- 가져오기 진행 상태 표시
- 가져온 덱 미리보기

#### [MODIFY] `client/src/components/DeckList.jsx` (또는 유사 컴포넌트)
- "덱 가져오기" 버튼 추가
- 가져온 덱 목록 표시

---

### 3단계: 한국어 지원 추가

#### [NEW] `client/src/i18n/ko.json`
- 한국어 번역 파일
- 모든 UI 텍스트 한국어화

#### [MODIFY] UI 컴포넌트들
- 하드코딩된 영어 텍스트를 i18n 키로 변경
- 언어 전환 기능 추가 (선택사항)

---

### 4단계: UI/UX 개선

#### [MODIFY] `client/src/index.css` 또는 스타일 파일들
- 모던한 디자인 시스템 적용
- 다크 모드 지원 (선택사항)
- 반응형 디자인 개선
- 애니메이션 및 트랜지션 추가

**디자인 개선 사항**:
- 프리미엄 색상 팔레트
- Google Fonts 사용 (예: Inter, Noto Sans KR)
- 카드 플립 애니메이션 개선
- 학습 진행도 시각화

---

### 5단계: 데이터베이스 마이그레이션 (옵션 B 선택 시)

#### [NEW] `client/src/db/indexedDB.js`
- IndexedDB 래퍼 함수
- 덱, 카드, 학습 기록 저장

#### [DELETE] 서버 관련 파일들 (옵션 B 선택 시)
- `server/` 디렉토리 전체
- PostgreSQL 설정 파일들

#### [MODIFY] API 호출 부분
- 서버 API 호출을 IndexedDB 호출로 변경

---

## 검증 계획

### 자동화 테스트

#### 1. Anki 덱 가져오기 테스트
```bash
# 테스트 파일 생성 필요
npm test -- ankiImporter.test.js
```

**테스트 내용**:
- 샘플 `.apkg` 파일 파싱 성공 여부
- 덱 정보 정확한 추출 확인
- 카드 개수 일치 확인
- 미디어 파일 추출 확인

#### 2. 간격 반복 알고리즘 테스트
```bash
# 기존 테스트가 있다면 실행
npm test
```

### 수동 검증

#### 1. 프로젝트 실행 확인
```bash
cd C:\win_asp_LMs\pangstudy
npm run dev
```
- 브라우저에서 `http://localhost:3000` 접속
- 앱이 정상적으로 로드되는지 확인

#### 2. 기본 기능 테스트
1. 새 덱 생성
2. 카드 추가 (앞면: 영어, 뒷면: 한국어)
3. 학습 세션 시작
4. "Again", "Hard", "Good", "Easy" 버튼 동작 확인
5. 카드가 적절한 간격으로 재등장하는지 확인

#### 3. Anki 덱 가져오기 테스트
1. 샘플 `.apkg` 파일 준비 (Anki에서 내보내기 또는 온라인에서 다운로드)
2. "덱 가져오기" 버튼 클릭
3. `.apkg` 파일 선택 또는 드래그 앤 드롭
4. 가져오기 진행 상태 확인
5. 가져온 덱이 덱 목록에 표시되는지 확인
6. 가져온 카드로 학습 시작
7. 이미지/오디오가 포함된 카드가 올바르게 표시되는지 확인

#### 4. 한국어 인터페이스 확인
- 모든 UI 텍스트가 한국어로 표시되는지 확인
- 한국어 폰트가 올바르게 렌더링되는지 확인

#### 5. 브라우저 호환성 테스트
- Chrome, Firefox, Edge에서 정상 작동 확인
- 모바일 브라우저에서 반응형 디자인 확인

---

## 다음 단계

1. **사용자 피드백**: 위의 데이터베이스 옵션(A/B/C) 중 선택
2. **프로젝트 클론**: GitHub에서 저장소 클론
3. **구현 시작**: 계획에 따라 단계별 구현
4. **테스트 및 검증**: 각 단계마다 기능 검증
5. **배포 준비**: 선택한 옵션에 따라 배포 방법 결정
