# task_1 단계별 보고서: 10단계 콘솔 snapshot 연결

## 단계 제목

Desktop 콘솔 화면과 Agent 콘솔 snapshot API 연결

## 변경 파일

- `apps/desktop/src/pages/ConsolePage.tsx`
- `apps/desktop/src/styles.css`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_10.md`

## 변경 내용

- 콘솔 화면의 정적 로그를 제거하고 Agent `/docker/containers/console` API 호출로 연결했다.
- 컨테이너 ID 입력 필드를 추가했다.
- 기본 컨테이너 ID를 `mc-minecraft-survival`로 설정했다.
- `콘솔 새로고침` 버튼을 눌러 Agent console snapshot을 가져오도록 했다.
- 콘솔 snapshot 성공/실패 메시지를 화면에 표시하도록 했다.
- 명령 전송 입력은 아직 실제 attach가 아니므로 disabled 상태로 표시했다.
- MVP 문서에 console snapshot 요청/응답 흐름을 추가했다.

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
$body=@{containerId='mc-minecraft-survival'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/containers/console' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 10
```

```powershell
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
- Agent `/docker/containers/console` HTTP 200 응답 확인
- console snapshot 응답에서 `mc-minecraft-survival`과 로그 라인 확인
- Desktop dev server HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 현재 콘솔은 streaming attach가 아니라 snapshot 방식이다.
- 명령 전송은 아직 연결하지 않았다.
- 현재 Agent가 memory mode이면 실제 Docker 로그가 아니라 memory adapter 메시지를 반환한다.
- 실제 Docker logs 확인은 Docker CLI mode에서 별도 검증해야 한다.

## 다음 단계

11단계에서 컨테이너 작업 버튼을 Agent action API와 연결한다.

예상 작업:

- 컨테이너 시작/중지/삭제 버튼을 `/docker/containers/action`에 연결
- 삭제 작업은 실제 Docker CLI mode에서 위험하므로 확인 UX 추가
- action 성공/실패 메시지 표시
- memory mode와 cli mode에서 동작 차이 안내

## 승인 요청

10단계 콘솔 snapshot 연결을 승인하고, 11단계 컨테이너 작업 버튼과 Agent action API 연결을 진행해도 되는지 승인을 요청한다.

