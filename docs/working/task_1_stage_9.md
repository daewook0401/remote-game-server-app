# task_1 단계별 보고서: 9단계 Docker CLI mode 가이드와 실패 상태 UX

## 단계 제목

Docker memory/cli mode 구분과 실패 상태 UX 보강

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/components/AgentStatusPanel.tsx`
- `apps/desktop/src/styles.css`
- `docs/guides/docker-cli-mode-guide.md`
- `docs/tech/agent-docker-control.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_9.md`

## 변경 내용

- 서버 관리 화면의 알림 메시지에 `info`, `success`, `warning`, `error` 상태를 추가했다.
- Agent 상태 확인 성공 시 `memory` mode는 warning, `cli` mode는 success로 표시하도록 했다.
- Agent 상태 확인 실패 시 error 스타일로 표시하도록 했다.
- `AgentStatusPanel`에서 현재 Docker mode를 badge로 표시하도록 했다.
- memory mode에서는 실제 Docker 컨테이너가 생성되지 않는다는 안내 패널을 추가했다.
- cli mode에서는 실제 Docker 명령이 실행될 수 있다는 안내 패널을 추가했다.
- Docker CLI mode 실행 가이드를 `docs/guides/docker-cli-mode-guide.md`에 작성했다.
- Agent Docker 제어 경계 문서에서 CLI mode 가이드를 연결했다.

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
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- Desktop dev server HTTP 200 응답 확인
- Agent `/docker/status` HTTP 200 응답 확인
- Agent `/docker/status` 응답: `available=true`, `mode=memory`
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 실제 UI 클릭 자동화는 수행하지 않았다.
- 현재 실행 중인 Agent는 memory mode다.
- Docker CLI mode의 실제 `docker run`은 수행하지 않았다.
- Docker CLI mode는 실제 컨테이너 상태를 변경할 수 있으므로 별도 명시 실행이 필요하다.

## 다음 단계

10단계에서 콘솔 화면을 Agent 콘솔 snapshot API와 연결한다.

예상 작업:

- Console 화면에서 `/docker/containers/console` 호출
- 컨테이너 선택 상태 추가
- 콘솔 API 실패/성공 상태 표시
- 실제 streaming attach 전 snapshot 기반 UI 검증

## 승인 요청

9단계 Docker CLI mode 가이드와 실패 상태 UX 보강을 승인하고, 10단계 콘솔 화면과 Agent 콘솔 snapshot API 연결을 진행해도 되는지 승인을 요청한다.

