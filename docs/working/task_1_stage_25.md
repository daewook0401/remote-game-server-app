# task_1 25단계 작업 보고서

## 제목

실제 Docker 생성 전환과 게임 포트 자동 오픈

## 변경 파일

- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/src/components/AgentStatusPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_25.md`
- `services/agent/internal/docker/factory.go`

## 작업 내용

- Desktop UI에서 memory mode 안내를 제거했다.
- Agent 상태 패널은 실제 Docker CLI 연결 상태를 기준으로 안내하도록 정리했다.
- Agent 기본 Docker 모드를 `cli`로 전환했다.
- `AGENT_DOCKER_MODE=memory`를 명시한 경우에만 테스트용 memory adapter를 사용하도록 했다.
- Minecraft 서버 생성 확인 단계에서 게임 포트 `externalPort/tcp`를 먼저 열고 Docker 컨테이너를 생성하도록 했다.
- 게임 포트 자동 오픈은 선택된 서버와 같은 SSH host/user가 등록 폼에 있고, SSH password 방식일 때만 실행하도록 했다.
- 기존 원격 서버에서도 `Agent 준비`를 다시 누르면 Release의 최신 `agent-linux-amd64`를 다시 다운로드해 교체하도록 했다.

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

## 실패 또는 특이사항

- 실제 원격 서버에서 게임 포트 오픈과 Docker 컨테이너 생성은 사용자가 직접 테스트해야 한다.
- SSH key 인증만 입력된 상태에서는 sudo 비밀번호를 재사용할 수 없으므로 게임 포트 자동 오픈이 막힌다.
- 클라우드 보안 그룹, 공유기 포트포워딩은 여전히 별도 수동 설정이 필요할 수 있다.

## 다음 단계

- 실제 원격 서버에서 `Agent 준비`를 다시 실행해 최신 Agent로 갱신한다.
- `Agent 상태 확인` 후 Minecraft 서버 생성을 실행해 게임 포트 오픈과 Docker 컨테이너 생성 결과를 확인한다.
