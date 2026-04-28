# task_1 26단계 작업 보고서

## 제목

Agent 상태 확인과 업데이트 필요 판정 분리

## 변경 파일

- `apps/desktop/src/components/AgentStatusPanel.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/types/api.ts`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_26.md`
- `services/agent/internal/api/server_test.go`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/service.go`

## 작업 내용

- Agent 응답에 `agentVersion` 필드를 추가했다.
- Desktop이 기대하는 Agent 버전을 `0.1.1`로 명시했다.
- 기존 Agent처럼 버전 필드가 없거나 기대 버전과 다르면 `업데이트 필요`로 표시하도록 했다.
- 생성 전 체크리스트에 Agent 버전 항목을 추가했다.
- Agent 버전이 맞지 않으면 Minecraft 서버 생성을 막고 `Agent 설치/업데이트` 실행을 안내하도록 했다.
- 서버 등록 영역의 `Agent 준비` 버튼명을 `Agent 설치/업데이트`로 변경했다.

## 검증 명령과 결과

```powershell
npm run desktop:typecheck
npm run desktop:build
```

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
```

실행 위치: `services/agent`

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
```

실행 위치: `services/relay`

결과: 성공.

```powershell
.\scripts\build-agent-linux.ps1
docker build -t remote-game-agent:test services/agent
npm audit --json
```

결과: 성공, 취약점 0개.

```powershell
UTF-8 scan
```

결과: `UTF8_ISSUES=0`.

## 다음 단계

- 최신 Agent 바이너리를 빌드하고 GitHub Release asset을 갱신한다.
- 실제 원격 서버에서 `Agent 설치/업데이트`를 실행한 뒤 `Agent 상태 확인`으로 버전과 Docker CLI 상태를 확인한다.
