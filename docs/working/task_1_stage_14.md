# task_1 단계별 보고서: 14단계 서버 생성 흐름 보강

## 단계 제목

게임/포트/실행 위치 선택 기반 서버 생성 흐름 반영

## 변경 파일

- `apps/desktop/src/components/ServerCreatePanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/api.ts`
- `apps/desktop/src/types/server.ts`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/memory_adapter.go`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/contracts_test.go`
- `services/agent/internal/api/server_test.go`
- `docs/feedback/task_1_server_creation_flow.md`
- `docs/tech/server-provisioning-flow.md`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_14.md`

## 변경 내용

- 서버 관리 화면에 `서버 생성 설정` 패널을 추가했다.
- 실행 위치를 `지금 PC`, `SSH 서버`, `클라우드 서버`로 선택할 수 있게 했다.
- SSH/클라우드 선택 시 SSH host, port, user 입력을 표시하도록 했다.
- 게임 템플릿, 서버 이름, 내부 포트, 외부 포트, 메모리, EULA 동의를 입력하도록 했다.
- 단순 `서버 연결` 버튼 대신 설정 기반 `서버 생성` 흐름으로 변경했다.
- Agent 생성 요청에 `targetType`, `sshHost`, `sshPort`, `sshUser`, `gameTemplateId`, `instanceId`, `internalPort`, `externalPort`를 포함했다.
- Docker CLI 생성 명령에 `remote-game-server.*` label을 추가했다.
- Agent 응답에 `instanceId`를 포함하도록 했다.
- Docker 생성 확인 기준을 label 기반으로 문서화했다.
- SSH는 Docker 명령 직접 실행이 아니라 Agent 설치/연결 부트스트랩 수단으로 우선 정의했다.

## 실행한 검증 명령

```powershell
npm run desktop:typecheck
npm run desktop:build
npm audit --json
```

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\internal\docker\contracts.go services\agent\internal\docker\contracts_test.go services\agent\internal\docker\memory_adapter.go services\agent\internal\docker\cli_adapter.go services\agent\internal\api\server_test.go
```

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
```

```powershell
$payload=@{serverId='local';targetType='local';gameTemplateId='minecraft-java';instanceId='minecraft-java-minecraft-survival';containerName='minecraft-survival';image='itzg/minecraft-server';internalPort=25565;externalPort=25565;memory='2G';eulaAccepted=$true} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/minecraft' -Method Post -ContentType 'application/json' -Body $payload -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- 새 Agent 프로세스 재시작 후 `/docker/minecraft` HTTP 201 응답 확인
- 응답에서 `port=25565`, `instanceId=minecraft-java-minecraft-survival` 확인
- Agent `/docker/status` HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 최초 직접 API 확인 때 실행 중인 Agent가 이전 코드라 `port=0`이 반환되었다.
- Agent 프로세스를 재시작한 뒤 새 계약으로 다시 검증해 `port=25565`와 `instanceId`가 정상 반환되는 것을 확인했다.
- SSH 연결과 Agent 설치 자동화는 아직 실제 구현하지 않았다.
- Docker label 기반 조회는 이번 단계에서 생성 명령과 문서 기준으로 반영했고, 실제 조회 API는 다음 묶음에서 구현해야 한다.

## 다음 단계

다음 큰 작업 묶음에서 Docker label 기반 컨테이너 조회와 서버 목록 동기화를 구현한다.

예상 작업:

- Agent에 managed container list API 추가
- Docker CLI mode에서 `docker ps -a --filter label=...` 기반 조회 추가
- Desktop 서버 관리 화면의 컨테이너 목록을 Agent 조회 API와 연결
- SSH/원격 서버 Agent 연결 상태 모델 구체화

## 승인 요청

14단계 서버 생성 흐름 보강을 승인하고, 다음 단계 Docker label 기반 컨테이너 조회와 서버 목록 동기화 작업을 진행해도 되는지 승인을 요청한다.

