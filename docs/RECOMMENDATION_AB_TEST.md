# 추천 가중치 A/B 테스트 계획

작성일: 2025-12-21

목표
- 추천 가중치(dued, assigned, recent, wrong)의 조합이 실제 사용자 행동(학습 시작, 복습 완료 등)에 미치는 영향을 계량적으로 확인.

핵심 지표 (KPIs)
- Study Starts per Recommendation (추천에서 `학습 시작` 클릭 수)
- Recommendation Conversion Rate = Study Starts / Recommendations Shown
- 평균 세션당 복습 수 (engagement)
- 추천 응답 시간 (latency)
- KV 캐시 적중률 (optional: 로그로 집계)

변형(Variants)
- Variant A (기본)
  - REC_WEIGHT_DUE=5
  - REC_WEIGHT_ASSIGNED=10
  - REC_WEIGHT_RECENT=1
  - REC_WEIGHT_WRONG=8

- Variant B (실험)
  - REC_WEIGHT_DUE=6
  - REC_WEIGHT_ASSIGNED=12
  - REC_WEIGHT_RECENT=2
  - REC_WEIGHT_WRONG=10

샘플링 및 기간
- 기간: 7일(권장) — 사용자 활동의 주간 패턴을 반영하기 위함
- 샘플 분할: 사용자 레벨(유저)로 랜덤 할당 — 동일 사용자는 한 변형에 고정
- 목표 최소 사용자 수: 통계적으로 유의미하려면 각 군 최소 수백 사용자 권장(작은 서비스면 더 길게 시행)

데이터 수집 방법
- 프런트엔드에서 추천 목록을 렌더링할 때 이벤트 기록(예: `recommendations_shown`) 전송
- 추천 항목 클릭(덱 보기 / 학습 시작) 이벤트 기록(예: `recommendation_click`) 전송
- 서버 측에서는 추천 API 호출 수와 응답 시간, KV 적중 여부(로그) 기록
- 기존 `functions/api/stats/*` 혹은 간단한 로깅 테이블(또는 외부 로그) 사용 권장

배포 및 운영 절차
1. `wrangler.toml` 또는 Pages 대시보드에서 `REC_WEIGHT_*` 환경변수를 Variant A/B로 설정하는 스크립트를 준비.
2. 트래픽 분배: 프론트엔드에서 `Math.random()` 기반으로 사용자에게 A/B 태그를 부여하고 로컬 스토리지에 고정.
   - 또는 서버에서 JWT 페이로드에 `ab_group` 삽입(복잡도 증가)
3. 클라이언트는 `recommendationsAPI.getRecommendations()` 호출 시 현재 사용자 그룹(A/B)에 따라 환경변수를 사용한 배포로 라우팅되도록 처리(간단 방법: 배포별 환경에서 서로 다른 REC_* 값을 운영).

간단 적용 방법 (빠른 테스트)
- 방법1 (단순): `wrangler.toml`에서 REC_* 값을 바꿔 배포(B를 테스트), 트래픽은 전체가 B로 이동.
  - 변경 후: `wrangler pages deploy client/build --branch main`
- 방법2 (권장 단계적): 클라이언트에서 사용자 그룹(A/B)을 결정하고, 추천 API 호출 시 `?variant=B` 파라미터 전달하여 서버에서 다른 가중치를 적용하도록 코드 확장(현재는 env 기반이라 추가 개발 필요).

성공 기준
- Variant B의 Recommendation Conversion Rate가 Variant A보다 유의미하게 높음(예: p<0.05) — B를 채택

후속
- 테스트 결과 요약 리포트(기간 종료 후) 작성 — KPI 변화표, 권장 가중치 결정
- 장기: 추천 알고리즘을 ML 모델(간단한 LR)로 대체 검토

문의 및 주의
- 실사용 데이터가 적으면 통계적 유의성 확보가 어렵습니다. 초기에는 장기간(2~4주) 관찰 권장.
