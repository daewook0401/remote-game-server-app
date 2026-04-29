# task_1 단계별 보고서: 5단계 서버 관리 흐름 반영

## 단계 제목

서버 관리 중심 Desktop UI와 Agent Docker 계약 초안 반영

## 변경 파일

- `apps/desktop/src/App.tsx`
- `apps/desktop/src/layout/AppShell.tsx`
- `apps/desktop/src/layout/Sidebar.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/pages/ConsolePage.tsx`
- `apps/desktop/src/pages/GuidesPage.tsx`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/TemplateCard.tsx`
- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `apps/desktop/src/types/navigation.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/styles.css`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/contracts_test.go`
- `docs/tech/mvp-publish-flow.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_5.md`

## 변경 내용

- Desktop UI 첫 흐름을 `외부 공개` 중심에서 `서버 관리` 중심으로 바꿨다.
- 간단한 로컬 라우팅 상태를 추가해 `서버 관리`, `콘솔`, `외부 공개`, `안내 가이드` 화면을 전환하도록 했다.
- 서버 관리 화면에 로컬 서버와 Amazon 서버 예시, Agent 상태, Docker 상태를 표시했다.
- Minecraft Java 템플릿 카드와 서버 생성 버튼을 추가했다.
- Docker 컨테이너 목록과 시작/중지/삭제 액션 UI를 추가했다.
- Docker 콘솔 화면에 로그 출력과 명령 입력 UI를 추가했다.
- 안내 가이드 화면에 클라우드 SSH, Agent 설치, UDP, Nginx Stream, 포트포워딩 항목을 추가했다.
- Agent에 Minecraft 서버 생성, 컨테이너 액션, 콘솔 접속 요청 계약 초안을 추가했다.
- MVP 문서에 Desktop 화면 구조와 Agent Docker 계약 초안을 추가했다.

## 실행한 검증 명령

```powershell
& 'C:\Program Files\Go\bin\gofmt.exe' -w services\agent\internal\docker\contracts.go services\agent\internal\docker\contracts_test.go services\agent\internal\frp\config.go services\agent\internal\frp\config_test.go services\relay\cmd\relay\main.go services\relay\internal\ports\allocator.go services\relay\internal\ports\allocator_test.go
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

## 검증 결과

- Agent `go test ./...` 성공
- Agent `go build ./cmd/agent` 성공
- Relay `go test ./...` 성공
- Relay `go build ./cmd/relay` 성공
- `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `npm audit` 취약점 0건
- `http://127.0.0.1:5173` HTTP 200 응답 확인
- 응답 HTML에서 `OpenServerHub` 문구 확인
- 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 최초 TypeScript 검증에서 `Sidebar`의 route 타입이 `string`으로 추론되어 실패했다.
- `navItems`에 `satisfies` 타입 제약을 추가해 `AppRoute` 타입으로 고정하고 재검증했다.
- 최초 Go 검증 묶음에서 `gofmt` 작업 디렉터리 경로 오류가 발생했다.
- 루트 작업 디렉터리에서 `gofmt`를 재실행해 성공했다.
- Docker 제어와 콘솔 접속은 아직 실제 Docker API 호출이 아니라 계약과 UI 초안 단계다.

## 다음 단계

6단계에서 실제 통신 계층을 만든다.

예상 작업:

- Desktop의 Agent client 계층 추가
- Agent Docker API 엔드포인트 초안 추가
- 컨테이너 목록/생성/시작/중지/삭제 요청 모델 연결
- 콘솔 attach 방식 조사와 설계 문서 작성

## 승인 요청

5단계 서버 관리 흐름 반영을 승인하고, 6단계 실제 통신 계층 초안 작업을 진행해도 되는지 승인을 요청한다.

