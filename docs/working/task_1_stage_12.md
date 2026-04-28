# task_1 단계별 보고서: 12단계 Docker CLI mode 안전 확인 UX

## 단계 제목

실제 Docker 조작 전 2단계 확인 UX와 문서 보강

## 변경 파일

- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `docs/guides/docker-cli-mode-guide.md`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_12.md`

## 변경 내용

- Docker CLI mode에서 `서버 연결`을 한 번 누르면 바로 `docker run`을 요청하지 않고 확인 상태로 전환하도록 했다.
- Docker CLI mode에서 `서버 연결`을 다시 눌렀을 때만 실제 생성 요청이 나가도록 했다.
- Docker CLI mode에서 컨테이너 `시작`, `중지`, `삭제` 모두 2단계 확인을 거치도록 했다.
- memory mode에서는 빠른 UI/API 흐름 확인을 위해 `시작`, `중지`는 바로 요청하고, 삭제는 기존처럼 확인 단계를 유지했다.
- `ContainerTable`의 pending 상태를 삭제 전용에서 모든 action 공통 구조로 확장했다.
- 실제 Docker 생성 확인 패널을 추가했다.
- 확인 대기 중인 버튼은 `시작 확인`, `중지 확인`, `삭제 확인`으로 표시되도록 했다.
- Docker CLI mode 실행 가이드에 Desktop UI 확인 단계 설명을 추가했다.
- MVP 문서에 Docker CLI mode에서는 생성/시작/중지/삭제 모두 확인 후 요청한다고 명시했다.

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
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- Agent `/docker/status` HTTP 200 응답 확인
- Agent `/docker/status` 응답: `available=true`, `mode=memory`
- Desktop dev server HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 실제 Docker CLI mode에서 `docker run`은 수행하지 않았다.
- UI 클릭 자동화는 수행하지 않았고, 타입/빌드/API 응답 검증으로 확인했다.
- 사용자가 요청한 작업 속도 피드백에 맞춰 다음 단계부터는 더 큰 기능 묶음 단위로 진행하고 보고한다.

## 다음 단계

13단계는 더 큰 작업 묶음으로 진행한다.

예상 작업:

- Relay client를 외부 공개 화면에 연결한다.
- 공개 시작 시 Relay 포트 할당을 호출한다.
- 공개 중지 시 Relay 포트 회수를 호출한다.
- Desktop 공개 상태와 Relay 응답을 동기화한다.
- 관련 문서와 검증을 한 보고서로 묶는다.

## 승인 요청

12단계 Docker CLI mode 안전 확인 UX 작업을 승인하고, 13단계 Relay 공개 흐름 연결 작업을 진행해도 되는지 승인을 요청한다.

