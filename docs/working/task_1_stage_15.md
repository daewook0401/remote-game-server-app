# task_1 15단계 작업 보고서

## 제목

Agent 관리 컨테이너 목록 API와 Desktop 목록 동기화

## 변경 파일

- `services/agent/internal/docker/adapter.go`
- `services/agent/internal/docker/service.go`
- `services/agent/internal/docker/memory_adapter.go`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/contracts_test.go`
- `services/agent/internal/api/server.go`
- `services/agent/internal/api/server_test.go`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `docs/tech/agent-docker-control.md`
- `docs/tech/server-provisioning-flow.md`
- `docs/orders/20260428.md`

## 작업 내용

- Agent에 `GET /docker/containers` API를 추가했다.
- Docker adapter 계약에 `ListManagedContainers`를 추가했다.
- Memory mode는 Agent 메모리에 생성된 컨테이너 목록을 반환하도록 했다.
- Docker CLI mode는 `remote-game-server.managed=true` label 기준으로 `docker ps -a`를 조회하고, 결과를 Desktop용 `ContainerSummary`로 정규화하도록 했다.
- Desktop Agent client에 `listManagedContainers`를 추가했다.
- 서버 관리 화면의 Docker 컨테이너 목록을 목업 데이터가 아니라 Agent 조회 결과로 갱신하도록 바꿨다.
- `Agent 상태 확인` 시 Docker 상태와 관리 컨테이너 목록을 함께 가져오도록 했다.
- `컨테이너 새로고침` 버튼을 추가해 사용자가 생성 여부를 직접 다시 확인할 수 있게 했다.
- 생성/시작/중지 작업 후 목록 재조회 흐름을 연결했다.
- Docker 생성 확인 기준과 API 계약 문서를 최신 흐름으로 보강했다.

## 검증 명령과 결과

```powershell
npm run desktop:typecheck
```

결과: 성공.

```powershell
npm run desktop:build
```

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
```

실행 위치:

- `services/agent`
- `services/relay`

결과: 모두 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
```

결과: 모두 성공.

```powershell
npm audit --json
```

결과: 취약점 0개.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/healthz' -UseBasicParsing
```

결과: `ok`.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/minecraft' -Method Post ...
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/containers' -UseBasicParsing
```

결과:

- 생성 API: HTTP 201
- 목록 API: HTTP 200
- 목록 응답에 `minecraft-java-minecraft-survival` instance가 포함됨.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

결과: HTTP 200.

## 실패 또는 특이사항

- `rg` 실행이 `Access is denied`로 실패해 PowerShell 기본 명령으로 탐색을 대체했다.
- Agent 재시작 직후 첫 `healthz` 호출은 컴파일/기동 타이밍 때문에 연결 실패가 한 번 발생했다. 잠시 후 포트 리슨 상태를 확인한 뒤 재호출했고 정상 응답을 받았다.
- 일반 `Get-Content` 출력에서는 한글이 깨져 보였지만, `Get-Content -Encoding utf8`과 TypeScript 컴파일 기준으로 파일 인코딩은 정상 UTF-8이었다.

## 다음 단계

- 원격/클라우드 서버 등록 모델을 더 구체화한다.
- SSH 연결 정보 입력 후 Agent 설치 확인, Docker 준비 상태 확인, 원격 Agent URL 등록 흐름을 UI에 추가한다.
- 컨테이너 상세 조회, 로그 스트리밍, 포트 공개 상태를 서버 카드와 연결한다.

## 승인 요청

15단계 작업을 완료했다. 다음 단계에서는 원격/클라우드 서버 등록과 Agent 연결 확인 흐름을 더 크게 묶어서 진행하면 된다.
