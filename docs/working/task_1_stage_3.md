# task_1 단계별 보고서: 3단계 Go 검증과 UI 구조 분리

## 단계 제목

Go 검증 재실행과 Desktop UI 구조 분리

## 변경 파일

- `.gitignore`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/layout/AppShell.tsx`
- `apps/desktop/src/layout/Sidebar.tsx`
- `apps/desktop/src/pages/PublishSettingsPage.tsx`
- `apps/desktop/src/components/AddressPanel.tsx`
- `apps/desktop/src/components/ModeCard.tsx`
- `apps/desktop/src/components/StatusPanel.tsx`
- `apps/desktop/src/components/Topbar.tsx`
- `apps/desktop/src/data/publishSettings.ts`
- `apps/desktop/src/types/publish.ts`
- `services/agent/internal/frp/config_test.go`
- `services/relay/internal/ports/allocator_test.go`
- `docs/feedback/task_1_go_and_ui_structure.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_3.md`

## 변경 내용

- Go가 PATH에 잡히지 않아 `C:\Program Files\Go\bin\go.exe` 직접 경로로 검증했다.
- Agent FRP 설정 렌더링 단위 테스트를 추가했다.
- Relay 포트 할당기 단위 테스트를 추가했다.
- `App.tsx`에 몰려 있던 화면 코드를 layout, page, component, data, type 단위로 분리했다.
- Go 빌드 산출물 `.exe`가 Git 추적 대상이 되지 않도록 `.gitignore`에 `*.exe`를 추가했다.
- 피드백을 `docs/feedback/task_1_go_and_ui_structure.md`에 기록했다.

## 실행한 검증 명령

```powershell
go version
where.exe go
```

```powershell
& 'C:\Program Files\Go\bin\go.exe' version
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

## 검증 결과

- `go`는 현재 PowerShell PATH에서 인식되지 않았다.
- `C:\Program Files\Go\bin\go.exe` 직접 경로로 Go `1.26.2` 확인.
- Agent `go test ./...` 성공.
- Agent `go build ./cmd/agent` 성공.
- Relay `go test ./...` 성공.
- Relay `go build ./cmd/relay` 성공.
- `gofmt` 루트 경로 기준 재실행 성공.
- `npm run desktop:typecheck` 성공.
- `npm run desktop:build` 성공.
- `npm audit` 취약점 0건.

## 실패 또는 특이사항

- 처음 `go version`, `where.exe go`는 실패했다. 설치는 되어 있었지만 현재 터미널 PATH에는 반영되지 않은 상태다.
- `gofmt`를 잘못된 작업 디렉터리에서 실행해 경로 오류가 2회 발생했다. 이후 루트 작업 디렉터리에서 다시 실행해 성공했다.
- Go 빌드로 `services/agent/agent.exe`, `services/relay/relay.exe`가 생성되었다. `.gitignore`에 `*.exe`를 추가해 추적되지 않도록 했다.
- 실제 TCP 접속 수동 검증은 현재 작업 공간의 한계로 수행하지 않았다.

## 다음 단계

4단계에서 MVP 기능 흐름을 더 구체화한다.

예상 작업:

- Desktop UI 상태 모델을 실제 액션 중심으로 분리
- Agent와 Relay API 계약 초안 작성
- FRP 설정 생성 요청/응답 데이터 모델 정의
- Relay 포트 할당 API 테스트 확장

## 승인 요청

3단계 Go 검증과 UI 구조 분리 작업을 승인하고, 4단계 MVP 기능 흐름 구체화를 진행해도 되는지 승인을 요청한다.

