# task_1 단계별 보고서: 6단계 통신 계층 초안

## 단계 제목

Desktop client 계층과 Agent HTTP API 초안 구현

## 변경 파일

- `apps/desktop/src/types/api.ts`
- `apps/desktop/src/services/httpClient.ts`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/services/relayClient.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `services/agent/cmd/agent/main.go`
- `services/agent/internal/api/server.go`
- `services/agent/internal/api/server_test.go`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/service.go`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_6.md`

## 변경 내용

- Desktop에 JSON POST 공통 client인 `httpClient`를 추가했다.
- Desktop에 Agent 호출 전용 `agentClient`를 추가했다.
- Desktop에 Relay 호출 전용 `relayClient`를 추가했다.
- Desktop API 요청/응답 타입을 `types/api.ts`에 추가했다.
- 서버 관리 화면의 `서버 연결` 버튼이 Agent의 Minecraft 생성 API를 호출하도록 초안을 연결했다.
- Agent를 HTTP API 서버 형태로 변경했다.
- Agent에 `/healthz`, `/docker/minecraft`, `/docker/containers/action`, `/docker/containers/console` 엔드포인트를 추가했다.
- Agent Docker 서비스 초안을 추가해 Minecraft 생성, 컨테이너 액션, 콘솔 snapshot 흐름을 표현했다.
- Agent API 단위 테스트를 추가했다.
- MVP 문서에 Agent API와 Desktop client 계층 초안을 추가했다.

## 실행한 검증 명령

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\cmd\agent\main.go services\agent\internal\api\server.go services\agent\internal\api\server_test.go services\agent\internal\docker\contracts.go services\agent\internal\docker\contracts_test.go services\agent\internal\docker\service.go services\agent\internal\frp\config.go services\agent\internal\frp\config_test.go
```

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
```

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
```

```powershell
npm run desktop:typecheck
npm run desktop:build
npm audit --json
```

```powershell
Start-Process -FilePath 'C:\Program Files\Go\bin\go.exe' -ArgumentList @('run','./cmd/agent') -WorkingDirectory 'C:\develop\side-project\game_saas\services\agent' -WindowStyle Hidden -PassThru
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/healthz' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/minecraft' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `/healthz` HTTP 200 응답 확인
- Agent `/docker/minecraft` HTTP 201 응답 확인
- Agent Minecraft 생성 응답에서 `minecraft-survival`, `running`, `25565` 확인
- Desktop dev server `http://127.0.0.1:5173` HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- Agent Docker 서비스는 아직 실제 Docker API를 호출하지 않는 메모리 기반 초안이다.
- Desktop의 Agent 호출은 실제 Agent 프로세스가 떠 있어야 성공한다.
- Relay client는 추가했지만 Desktop 공개 화면에는 아직 연결하지 않았다.
- Agent 프로세스를 검증용으로 `go run ./cmd/agent`로 실행했다.
- 실제 TCP 게임 접속 검증은 현재 작업 공간의 한계로 수행하지 않았다.

## 다음 단계

7단계에서 Docker 실제 제어 또는 그 직전의 명령 실행 경계를 구체화한다.

예상 작업:

- Agent Docker adapter 인터페이스 추가
- Docker CLI 또는 Docker Engine API 사용 방식 결정
- 컨테이너 생성 요청을 실제 Docker 실행 명령으로 변환하는 계층 추가
- Desktop에서 Agent 연결 실패 상태를 더 명확히 표시

## 승인 요청

6단계 통신 계층 초안을 승인하고, 7단계 Docker 실제 제어 경계 작업을 진행해도 되는지 승인을 요청한다.

