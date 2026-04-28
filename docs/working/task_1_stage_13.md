# task_1 단계별 보고서: 13단계 Relay 공개 흐름 연결

## 단계 제목

외부 공개 화면과 Relay 포트 할당/회수 API 연결

## 변경 파일

- `apps/desktop/src/pages/PublishSettingsPage.tsx`
- `apps/desktop/src/services/publishWorkflow.ts`
- `services/agent/internal/api/server.go`
- `services/relay/cmd/relay/main.go`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_13.md`

## 변경 내용

- 외부 공개 화면의 `공개 시작` 버튼을 Relay `POST /ports/allocate` API와 연결했다.
- Relay 포트 할당 성공 시 `relay.example.com:{port}` 주소가 표시되도록 상태를 연결했다.
- 외부 공개 화면의 `공개 중지` 버튼을 Relay `POST /ports/release` API와 연결했다.
- 공개 중지 성공 시 Relay 포트를 제거하고 상태를 `idle`로 되돌리도록 했다.
- Relay API 호출 실패 시 `failed` 상태와 오류 메시지를 표시하도록 했다.
- 기존 데모 포트 `31001` 고정값을 제거하고 Relay API 응답 포트를 사용하도록 했다.
- Agent API와 Relay API에 개발 UI(`http://127.0.0.1:5173`)용 CORS 처리를 추가했다.
- MVP 문서에 Desktop 외부 공개 흐름과 CORS 기준을 추가했다.

## 실행한 검증 명령

```powershell
npm run desktop:typecheck
npm run desktop:build
npm audit --json
```

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\internal\api\server.go services\relay\cmd\relay\main.go
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
Invoke-WebRequest -Uri 'http://127.0.0.1:8080/ports/allocate' -Method Post -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:8080/ports/release' -Method Post -ContentType 'application/json' -Body '{"port":31000}' -UseBasicParsing -TimeoutSec 10
```

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:8080/ports/allocate' -Method Options -Headers @{Origin='http://127.0.0.1:5173'; 'Access-Control-Request-Method'='POST'} -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -Method Options -Headers @{Origin='http://127.0.0.1:5173'; 'Access-Control-Request-Method'='GET'} -UseBasicParsing -TimeoutSec 10
```

## 검증 결과

- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- Relay `POST /ports/allocate` HTTP 200 응답 확인
- Relay `POST /ports/release` HTTP 204 응답 확인
- Relay CORS preflight HTTP 204 응답 확인
- Agent CORS preflight HTTP 204 응답 확인
- Desktop dev server HTTP 200 응답 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 최초 검증 묶음에서 `gofmt` 작업 디렉터리 경로 오류가 섞였고, 루트에서 단독 재실행해 성공했다.
- 현재 외부 공개는 Relay 포트 할당/회수까지만 연결되어 있다.
- 실제 `frps/frpc` 터널 실행과 Minecraft TCP 접속 검증은 아직 수행하지 않았다.
- CORS 허용 origin은 개발 UI 주소 `http://127.0.0.1:5173`로 제한했다.

## 다음 단계

14단계는 더 큰 기능 묶음으로 Agent FRP 설정 생성과 Relay 공개 흐름을 연결한다.

예상 작업:

- 공개 시작 후 Agent FRP 설정 요청 모델 연결
- Agent에 FRP 설정 preview API 추가
- Desktop 외부 공개 화면에서 Relay 포트와 FRP 설정 preview 표시
- 실제 `frpc` 실행 전 안전 확인 UX 추가

## 승인 요청

13단계 Relay 공개 흐름 연결을 승인하고, 14단계 Agent FRP 설정 preview와 공개 흐름 연결 작업을 진행해도 되는지 승인을 요청한다.

