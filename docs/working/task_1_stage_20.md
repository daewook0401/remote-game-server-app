# task_1 20단계 작업 보고서

## 제목

Linux Agent 배포물과 SSH Agent 준비 흐름

## 변경 파일

- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/agentBootstrapClient.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/vite-env.d.ts`
- `services/agent/cmd/agent/main.go`
- `services/agent/Dockerfile`
- `services/agent/.dockerignore`
- `scripts/build-agent-linux.ps1`
- `docs/tech/linux-agent-distribution.md`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/working/task_1_stage_20.md`
- `docs/orders/20260428.md`

## 작업 내용

- Desktop에 `Agent 준비` 버튼을 추가했다.
- Electron preload/main에 `agent:prepare` IPC를 추가했다.
- Linux 서버에서 `/opt/remote-game-agent/agent` 존재 여부를 확인하고, 없으면 다운로드하도록 했다.
- Agent 실행 환경 파일 `/opt/remote-game-agent/.env`를 생성하도록 했다.
- systemd service `remote-game-agent.service`를 생성하고 재시작하도록 했다.
- systemd가 없으면 `nohup` fallback으로 Agent를 실행하도록 했다.
- Agent 준비 후 서버 내부 18080 포트 listen 여부와 Desktop의 Agent API 접근 여부를 확인하도록 했다.
- Agent 실행 주소를 `AGENT_ADDR` 환경변수로 제어할 수 있게 했다.
- Linux bootstrap에서는 `AGENT_ADDR=0.0.0.0:18080`으로 실행하도록 했다.
- Linux Agent cross build 스크립트 `scripts/build-agent-linux.ps1`를 추가했다.
- Agent Dockerfile과 `.dockerignore`를 추가했다.
- Linux Agent 배포 문서를 추가했다.

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
.\scripts\build-agent-linux.ps1
```

결과: 성공. `dist/agent-linux-amd64` 생성.

```powershell
docker build -t remote-game-agent:test services/agent
```

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
```

실행 위치:

- `services/agent`
- `services/relay`

결과: 모두 성공.

## 실패 또는 특이사항

- 실제 외부 SSH 서버에서 Agent 다운로드/실행은 사용자 서버 정보와 실제 Release 파일이 필요하므로 수행하지 않았다.
- 기본 다운로드 URL은 GitHub Release의 `agent-linux-amd64`를 가리키도록 넣었다.
- 원격 서버에서 `sudo` 권한이 필요할 수 있다.
- Agent API 외부 접근을 위해 방화벽/보안 그룹/포트포워딩이 필요할 수 있다.

## 다음 단계

- GitHub Release 자동 업로드 또는 배포 스크립트를 추가한다.
- Agent 준비 결과를 서버 카드 상태에 반영한다.
- Docker 미설치 서버에 OS별 Docker 설치 안내를 표시한다.

## 승인 요청

20단계 작업을 완료했다. 다음 단계에서는 Release 배포 자동화와 Agent 준비 결과 UI 반영을 진행하면 된다.
