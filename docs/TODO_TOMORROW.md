# TODO — 내일(다음 작업)

작성일: 2025-12-21

요약: 오늘은 추천 기능(MVP) 개발과 KV 캐시 연동, 클라이언트 UI 연결 및 원격 테스트까지 진행했습니다. 아래는 내일 이어서 할 작업과 간단한 확인/테스트 방법입니다.

현재 상태
- 최신 배포: https://3ccdb0e2.pangstudy.pages.dev
- KV 네임스페이스: `REC_CACHE_NAMESPACE` (ID: `b09faba7bca54c87b0be30f13cca198f`)
- 변경된 주요 파일:
  - `functions/api/recommendations.js` (추천 로직, KV 캐시, SQL 호환성, JWT 폴백)
  - `functions/_middleware.js` (임시 디버그 로깅)
  - `functions/api/debug/echo.js` (디버그 엔드포인트)
  - `client/src/components/Recommendations.js` (추천 UI)
  - `client/src/utils/api.js` (recommendationsAPI 추가)
  - `wrangler.toml` (KV 바인딩 및 REC_* 기본값 추가)
  - `docs/CLOUDFLARE_KV_SETUP.md` (KV 설정 가이드)

우선순위(내일 할 일)
1. 디버그 정리: 미들웨어 로그(`functions/_middleware.js`)와 `functions/api/debug/echo.js` 제거 또는 주석 처리 후 재배포. (긴급)
2. 운영 환경변수 점검: `REC_WEIGHT_*`, `REC_CACHE_SECONDS` 값을 운영에 맞게 검토 및 적용.
3. 가중치 실험 설계: 한두 세트의 가중치(예: A: due=5,assigned=10,wrong=8; B: due=6,assigned=12,wrong=10)로 AB 테스트 시나리오 작성.
4. 캐시 정책 문서화: 캐시 키 네이밍, TTL, 무효화 전략 정리.
5. 모니터링/로깅: 추천 API 호출 수, KV 적중률(간단 로그), 응답 시간 수집 방법 결정.
6. UI 개선: 추천 상세 토글, 정렬, 페이지네이션 기초 설계.
7. 최종 정리 후 운영 재배포: 필요 시 `wrangler pages deploy client/build --branch main` 실행.

간단한 로컬/원격 테스트 명령

- 로컬 Pages 개발 (D1 연결):
```powershell
wrangler pages dev client/build --d1 DB=pangstudy-db
```

- 원격 배포 (빌드 필요):
```powershell
$env:NODE_OPTIONS='--openssl-legacy-provider'
npm --prefix client install --legacy-peer-deps
npm --prefix client run build
wrangler pages deploy client/build --branch main
```

- 추천 API 직접 호출 예 (토큰 필요):
```powershell
curl -H "Authorization: Bearer <JWT>" "https://3ccdb0e2.pangstudy.pages.dev/api/recommendations?my=1"
```

비고
- 오늘 추가한 디버그/폴백 코드는 진단 목적이므로 내일 바로 정리하는 것을 권장합니다.
- DB 스키마 차이(`next_review` vs `next_review_date`)를 고려해 로직을 작성해 두었습니다.

내일 시작할 때 제가 자동으로 다음 항목(1번: 디버그 정리)을 `in-progress`로 옮겨서 작업을 시작하겠습니다.

---
좋은 마무리였습니다 — 내일 이어서 하겠습니다.