# task_1 21단계 작업 보고서

## 제목

Electron main 리팩토링과 서버 준비 상태 UI 반영

## 변경 파일

- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/services/serverStorageService.ts`
- `apps/desktop/electron/services/sshDiagnosticsService.ts`
- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/electron/ssh/detection.ts`
- `apps/desktop/electron/ssh/sshClient.ts`
- `apps/desktop/src/components/DockerInstallGuide.tsx`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/server.ts`
- `docs/tech/linux-agent-distribution.md`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/working/task_1_stage_21.md`
- `docs/orders/20260428.md`

## 작업 내용

- Electron `main.ts`에서 SSH, Agent bootstrap, 저장소 로직을 분리했다.
- `main.ts`는 창 생성과 IPC 등록 호출만 담당하도록 얇게 정리했다.
- 서버 저장 IPC, SSH 진단 IPC, Agent 준비 IPC를 별도 모듈로 분리했다.
- SSH 연결 실행, OS/Docker/Agent 상태 감지, Agent bootstrap 스크립트 생성을 별도 모듈로 분리했다.
- Agent 준비 결과를 등록된 서버 카드 상태에 반영하도록 했다.
- 등록 전 Agent 준비를 수행해도 동일 Agent URL 또는 SSH host 기준으로 서버 카드를 생성/갱신하도록 했다.
- Docker 미설치가 감지되면 OS별 Docker 설치 안내 패널을 표시하도록 했다.
- GitHub Release 자동 업로드는 사용자 요청에 따라 이번 단계에서 제외했다.

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
.\scripts\build-agent-linux.ps1
docker build -t remote-game-agent:test services/agent
```

결과: 모두 성공.

```powershell
npm audit --json
```

결과: 취약점 0개.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

결과: HTTP 200.

## 실패 또는 특이사항

- 실제 외부 SSH 서버 접속은 사용자 서버 정보가 필요하므로 수행하지 않았다.
- GitHub Release 자동 업로드 또는 업로드 스크립트는 이번 단계에서 제외했다.

## 다음 단계

- Docker 설치 안내를 Agent 준비 실패 사유와 더 정교하게 연결한다.
- 실제 SSH 서버로 Agent 준비 시나리오를 수동 검증한다.
- Release 업로드는 사용자가 다시 요청할 때 별도 단계로 진행한다.

## 승인 요청

21단계 작업을 완료했다. 다음 단계에서는 실제 SSH 서버 검증 또는 Docker 설치 안내 고도화를 진행하면 된다.
