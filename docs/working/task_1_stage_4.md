# task_1 단계별 보고서: 4단계 MVP 기능 흐름 구체화

## 단계 제목

MVP 공개 흐름 상태 모델, Relay 포트 계약, Agent FRP 설정 계약 구체화

## 변경 파일

- `apps/desktop/src/types/publish.ts`
- `apps/desktop/src/services/publishWorkflow.ts`
- `apps/desktop/src/components/Topbar.tsx`
- `apps/desktop/src/pages/PublishSettingsPage.tsx`
- `apps/desktop/src/data/publishSettings.ts`
- `apps/desktop/src/styles.css`
- `services/agent/internal/frp/config.go`
- `services/agent/internal/frp/config_test.go`
- `services/relay/cmd/relay/main.go`
- `services/relay/internal/ports/allocator.go`
- `services/relay/internal/ports/allocator_test.go`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_4.md`

## 변경 내용

- Desktop UI에 `PublishSession` 상태 모델을 추가했다.
- 공개 상태를 `idle`, `allocating`, `published`, `stopping`, `failed`로 정의했다.
- 공개 시작/중지 버튼 흐름을 추가했다.
- 접속 주소와 상태 목록이 세션 상태에서 계산되도록 분리했다.
- Agent에 `CreateProxyRequest`와 `NewProxyConfig`를 추가해 FRP 설정 요청 계약을 코드로 표현했다.
- Relay 포트 할당기에 `Release`를 추가해 포트 회수 흐름을 표현했다.
- Relay API 초안에 `POST /ports/allocate`, `POST /ports/release`를 추가했다.
- MVP 공개 흐름 문서를 `docs/tech/mvp-publish-flow.md`에 작성했다.

## 실행한 검증 명령

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\cmd\agent\main.go services\agent\internal\frp\config.go services\agent\internal\frp\config_test.go services\relay\cmd\relay\main.go services\relay\internal\ports\allocator.go services\relay\internal\ports\allocator_test.go
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
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
```

```powershell
$files=Get-ChildItem -Recurse -File -Include *.md,*.json,*.ts,*.tsx,*.css,*.html,*.go,*.mod -Exclude package-lock.json | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\dist-electron\\' }
$utf8=New-Object System.Text.UTF8Encoding($false,$true)
foreach ($file in $files) {
  $bytes=[System.IO.File]::ReadAllBytes($file.FullName)
  $text=$utf8.GetString($bytes)
  if ($text.Contains([char]0xFFFD)) {
    "REPLACEMENT $($file.FullName)"
  }
}
```

## 검증 결과

- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- `gofmt` 루트 작업 디렉터리 기준 성공
- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- `http://127.0.0.1:5173` HTTP 200 응답 확인
- 응답 HTML에서 `OpenServerHub` 문구 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 처음 검증 묶음에서 `gofmt`를 잘못된 작업 디렉터리 기준으로 호출해 경로 오류가 발생했다.
- 이후 루트 작업 디렉터리에서 `gofmt`를 단독 재실행해 성공했다.
- Desktop UI의 공개 시작/중지는 아직 실제 Agent/Relay 통신이 아니라 로컬 상태 모델 기반이다.
- 실제 TCP 접속 수동 검증은 현재 작업 공간의 한계로 수행하지 않았다.

## 다음 단계

5단계에서 실제 통신 경계와 데이터 계약을 더 구체화한다.

예상 작업:

- Desktop에서 Relay/Agent 호출을 담당할 client 계층 추가
- Relay API 요청/응답 모델 테스트 확장
- Agent FRP 설정 파일 저장 위치와 권한 정책 초안 작성
- 실패 상태와 에러 메시지 표시 흐름 추가

## 승인 요청

4단계 MVP 기능 흐름 구체화를 승인하고, 5단계 통신 경계와 데이터 계약 구체화를 진행해도 되는지 승인을 요청한다.

