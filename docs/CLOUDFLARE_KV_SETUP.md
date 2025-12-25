# Cloudflare KV (Workers KV) 설정 가이드

이 문서는 `functions/api/recommendations.js`에서 사용할 KV 네임스페이스를 생성하고, 프로젝트에 바인딩하는 방법을 안내합니다.

1) KV 네임스페이스 생성

PowerShell에서 wrangler를 사용해 네임스페이스를 생성합니다:

```powershell
wrangler kv:namespace create "REC_CACHE_NAMESPACE" --preview
```

- 위 명령은 로컬 preview 환경에 네임스페이스를 생성합니다. 운영(원격)용으로는 `--preview`를 빼고 실행하세요.
- 생성 후 출력된 `id` 값을 기록해 두세요.

2) `wrangler.toml`에 바인딩 추가

`wrangler.toml`에 아래와 같은 섹션을 추가합니다 (파일 상단 `name`/`type` 등 기본 설정을 건드리지 마세요):

```toml
[[kv_namespaces]]
binding = "REC_CACHE_NAMESPACE"
id = "<생성된_KV_ID>"
```

- `binding`에는 코드에서 참조할 변수명(`env.REC_CACHE_NAMESPACE`)을 적습니다.
- `id`는 1)에서 생성된 KV 네임스페이스 ID로 교체하세요.

3) 환경변수 (권장)

추천 API 동작을 조절하기 위해 다음 환경변수를 설정할 수 있습니다 (Cloudflare Pages 또는 Wrangler 환경 설정에 추가).

- `REC_WEIGHT_DUE` (기본값: `5`)
- `REC_WEIGHT_ASSIGNED` (기본값: `10`)
- `REC_WEIGHT_RECENT` (기본값: `1`)
- `REC_WEIGHT_WRONG` (기본값: `8`)
- `REC_CACHE_SECONDS` (기본값: `30`) — KV에 보관할 TTL(초)

Pages 대시보드나 `wrangler secret`/`wrangler publish --env` 방식으로 설정할 수 있습니다.

4) 개발(로컬) 테스트

로컬에서 Pages Functions와 D1을 연결해 테스트하려면 아래 명령을 사용하세요 (이미 DB가 설정되어 있다고 가정):

```powershell
wrangler pages dev client/build --d1 DB=pangstudy-db
```

KV 바인딩을 로컬에서 사용하려면 `wrangler dev` 또는 `wrangler pages dev`에서 `kv_namespaces` 설정이 올바르게 로드되어야 합니다.

5) 참고

- KV는 eventual consistency가 있으므로 빈번한 실시간 업데이트가 필요하다면 다른 캐시 전략(Workers Durable Objects, R2 또는 외부 캐시)을 고려하세요.
- 추천 결과는 사용자별로 캐시하므로 캐시 키 설계를 잘 해야 합니다 (예: 권한 변경, 가중치 변경 시 키를 분리).

문제가 생기면 `wrangler kv:namespace list`로 네임스페이스 존재를 확인하고, `wrangler kv:namespace create`를 다시 시도하세요.
