# task_1 단계별 보고서: 11단계 컨테이너 action 연결

## 단계 제목

컨테이너 시작/중지/삭제 버튼과 Agent action API 연결

## 변경 파일

- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_11.md`

## 변경 내용

- 컨테이너 테이블의 `시작`, `중지`, `삭제` 버튼을 실제 handler로 연결했다.
- `ServerManagementPage`에서 컨테이너 목록을 상태로 관리하도록 변경했다.
- 서버 생성 성공 시 Agent 응답 컨테이너를 테이블에 반영하도록 했다.
- `시작`, `중지` 버튼은 Agent `/docker/containers/action` API를 호출하도록 했다.
- `삭제` 버튼은 즉시 삭제하지 않고, 먼저 `삭제 확인` 상태를 거치도록 했다.
- `삭제 확인` 버튼을 눌렀을 때 Agent delete action을 호출하고 UI 목록에서 제거하도록 했다.
- 목업 컨테이너 ID를 Agent memory adapter 생성 규칙과 맞춰 `mc-minecraft-survival`로 변경했다.
- MVP 문서에 컨테이너 action 요청/응답 흐름을 추가했다.

## 실행한 검증 명령

```powershell
npm run desktop:typecheck
npm run desktop:build
npm audit --json
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
$create=@{serverId='local';containerName='minecraft-survival';image='itzg/minecraft-server';port=25565;memory='2G';eulaAccepted=$true} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/minecraft' -Method Post -ContentType 'application/json' -Body $create -UseBasicParsing -TimeoutSec 10
```

```powershell
foreach ($action in @('stop','start','delete')) {
  $body=@{containerId='mc-minecraft-survival'; action=$action} | ConvertTo-Json
  Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/containers/action' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 10
}
```

## 검증 결과

- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- Agent `/docker/minecraft` HTTP 201 응답 확인
- Agent `/docker/containers/action` stop HTTP 200 응답 확인
- Agent `/docker/containers/action` start HTTP 200 응답 확인
- Agent `/docker/containers/action` delete HTTP 200 응답 확인
- Desktop dev server HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 생성 전에 action API를 직접 호출하면 memory adapter에 컨테이너가 없어 HTTP 400이 반환된다.
- UI에서는 서버 생성 응답을 테이블 상태에 반영한 뒤 action을 호출하는 흐름으로 보완했다.
- 현재 검증은 memory mode 기준이며 실제 Docker 컨테이너를 조작하지 않았다.
- 삭제는 위험 동작이므로 UI에서 `삭제` 후 `삭제 확인`을 한 번 더 누르는 흐름으로 만들었다.

## 다음 단계

12단계에서 실제 Docker CLI mode 실행 전 안전 확인 UX와 실행 안내를 더 구체화한다.

예상 작업:

- Docker CLI mode에서 `서버 생성` 클릭 전 확인 모달 또는 확인 단계 추가
- memory mode와 cli mode의 생성/삭제 결과 차이 문구 보강
- 실제 Docker run 테스트를 수행할지 별도 승인 받기

## 승인 요청

11단계 컨테이너 action 연결을 승인하고, 12단계 Docker CLI mode 안전 확인 UX 작업을 진행해도 되는지 승인을 요청한다.

