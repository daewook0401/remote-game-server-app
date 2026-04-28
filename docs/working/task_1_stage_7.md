# task_1 단계별 보고서: 7단계 Docker 제어 경계

## 단계 제목

Agent Docker adapter 경계와 Docker CLI mode 초안 구현

## 변경 파일

- `services/agent/cmd/agent/main.go`
- `services/agent/internal/api/server.go`
- `services/agent/internal/api/server_test.go`
- `services/agent/internal/docker/adapter.go`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/contracts_test.go`
- `services/agent/internal/docker/factory.go`
- `services/agent/internal/docker/memory_adapter.go`
- `services/agent/internal/docker/service.go`
- `docs/tech/agent-docker-control.md`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_7.md`

## 변경 내용

- Agent Docker 제어를 `Adapter` 인터페이스로 분리했다.
- 기본 실행용 `MemoryAdapter`를 추가했다.
- 실제 Docker CLI 실행용 `CLIAdapter` 초안을 추가했다.
- `AGENT_DOCKER_MODE=cli`일 때 Docker CLI adapter를 선택하도록 factory를 추가했다.
- `AGENT_DOCKER_PATH`로 Docker 실행 파일 경로를 지정할 수 있게 했다.
- Agent에 `GET /docker/status` 엔드포인트를 추가했다.
- Docker CLI mode에서 사용할 `docker run`, `docker start`, `docker stop`, `docker rm -f`, `docker logs` 명령 경계를 코드로 만들었다.
- Docker CLI 명령 인자 생성 테스트를 추가했다.
- Docker 제어 경계 문서 `docs/tech/agent-docker-control.md`를 작성했다.

## 실행한 검증 명령

```powershell
docker --version
docker ps --format "{{.ID}} {{.Image}} {{.Status}}"
docker version --format "{{.Server.Version}}"
```

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\cmd\agent\main.go services\agent\internal\api\server.go services\agent\internal\api\server_test.go services\agent\internal\docker\adapter.go services\agent\internal\docker\cli_adapter.go services\agent\internal\docker\contracts.go services\agent\internal\docker\contracts_test.go services\agent\internal\docker\factory.go services\agent\internal\docker\memory_adapter.go services\agent\internal\docker\service.go
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
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- Docker CLI 설치 확인: Docker `29.4.0`
- `docker ps` 실행 성공
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `/docker/status` HTTP 200 응답 확인
- `/docker/status` 응답: `available=true`, `mode=memory`
- Desktop dev server HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 최초 테스트에서 `strings` import 누락으로 Agent Docker 패키지 빌드가 실패했다.
- `contracts_test.go`에 `strings` import를 추가하고 재검증했다.
- `gofmt`를 잘못된 작업 디렉터리 기준으로 호출한 오류가 한 번 발생했다.
- 루트 작업 디렉터리에서 `gofmt`를 재실행해 성공했다.
- 실제 Minecraft Docker 이미지 pull/run은 수행하지 않았다.
- 실제 Docker 제어는 `AGENT_DOCKER_MODE=cli`를 명시적으로 설정해야 활성화된다.

## 다음 단계

8단계에서 Desktop과 Agent Docker 상태를 더 직접 연결한다.

예상 작업:

- Desktop Agent 상태 확인 버튼을 `/docker/status`에 연결
- 서버 관리 화면에서 Docker mode/available/message 표시
- Docker CLI mode 실행 가이드 추가
- 실제 Docker run은 별도 승인 후 수행

## 승인 요청

7단계 Docker 제어 경계 작업을 승인하고, 8단계 Desktop-Agent 상태 연결 작업을 진행해도 되는지 승인을 요청한다.

