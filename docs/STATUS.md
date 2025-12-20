```markdown
# Project Status — Pangstudy

**Last updated:** 2025-12-20

## 한줄 요약
- 현재 프로젝트는 기본 기능(로그인/회원가입, 덱/카드 관리, SM-2 기반 복습, 배포) 동작 중입니다. 최신 클라이언트 빌드가 Cloudflare Pages에 배포되어 접근 가능합니다.

## 최신 배포
- URL: https://ae39d317.pangstudy.pages.dev
- 배포 일시: 2025-12-15

## 현재 상태(주요 항목)
- 코드베이스: `main` 브랜치 최신 상태(원격과 동기화됨).
- 로컬 변경: 빌드 산출물이 로컬에 존재했고 안전하게 스태시(`auto-stash-before-build-2025-12-15`)로 보관됨.
- 빌드: 클라이언트 `npm run build` 성공(경고 존재). SPA 빌드 결과를 Pages에 배포 완료.
- 인증: JWT 토큰 만료는 서버에서 발급 시 7일로 설정됨(`functions/api/auth/login.js`).

## 보안·품질 관련
- `npm audit` 결과: 다수의 취약점(높음/치명적 포함) 보고됨 — 시급하게 종속성 점검 필요.
- 빌드 환경 이슈: Node 25 환경에서 OpenSSL 호환성으로 인해 빌드 실패가 있었고, 임시로 `NODE_OPTIONS=--openssl-legacy-provider`를 사용하여 빌드함. 권장: Node LTS(18.x 또는 20.x)로 전환.
- ESLint 경고: `StudySession.js`의 접근성(emoji) 관련 경고 존재(해결 권장).

## 완료된 주요 작업
1. 로그인/회원가입 리다이렉션 수정(자동 이동 `/decks`) — 완료
2. JWT_SECRET 값 강화 및 `wrangler.toml` 환경 적용 — 완료
3. 카드 편집 API 추가 — 완료
4. Reviews 테이블 마이그레이션(SM-2 필드 추가) — 완료
5. 클라이언트 빌드 및 Cloudflare Pages 배포 — 완료(2025-12-15)

## 현재 진행 중/우선 순위 작업
1. (높음) 의존성 취약점 정리 및 호환성 검토 (`npm audit fix` 및 버전 업그레이드)
2. (중) Node 버전 정리: LTS로 전환 및 CI/CD 빌드 환경 조정
3. (중) 코드 품질 개선: ESLint 경고 수정 및 접근성 개선
4. (중) 스태시된 로컬 변경 검토 후 필요시 병합 또는 커밋
5. (낮) 추가 기능: 세션 타이머(포모도로 등), 다크 모드, 키보드 단축키

## 당장 해야 할 일 (권장 우선순위)
1. 로컬 스태시 복원 및 변경 사항 확인
   - 명령: `git stash list` → `git stash show -p stash@{0}` → `git stash pop` (충돌 시 수동 해결)
2. 의존성 자동 수리 시도
   - `cd client` 
   - `npm audit fix` (비파괴적 수정)
   - 필요 시 `npm audit fix --force`(파괴적일 수 있음, 사전 리뷰 필요)
3. 장기: 패키지 업그레이드(React/라이브러리) 및 테스트 추가

## 담당자 제안 / 다음 단계 (제가 도와드릴 수 있는 것)
- 제가 대신 아래 작업을 실행해 드릴 수 있습니다:
  1. 스태시 내용 복원(`git stash pop`) 및 변경사항 충돌 해결
  2. `npm audit fix` 실행 후 결과 검토 및 PR 생성(의존성 업그레이드)
  3. `StudySession.js` 접근성 경고 수정 및 소규모 리팩터
  4. Node LTS 적용 방법 안내 및 CI 환경에 반영

원하시면 어떤 작업(A~D)을 먼저 진행할지 알려주세요:
- A) 스태시 복원 및 로컬 변경 복구
- B) 의존성 취약점 자동 수리 + 결과 보고
- C) ESLint/접근성 문제(StudySession) 우선 수정
- D) Node LTS 적용 안내 및 CI 설정 변경

```