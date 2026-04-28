# task_1 28단계 작업 보고서

## 제목

Agent 설치/업데이트 분리와 앱 내부 팝업 전환

## 변경 파일

- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/src/components/AppModal.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/components/ToastViewport.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_28.md`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/factory.go`

## 작업 내용

- `Agent 설치`와 `Agent 업데이트` 버튼을 분리했다.
- `Agent 업데이트`는 앱 내부 모달에서 SSH password를 입력받도록 했다.
- 안내, 성공, 실패 메시지를 시스템 팝업이 아닌 앱 우측 상단 토스트로 표시하도록 했다.
- 기존 상단 고정 알림 바는 제거하고, 상태 메시지는 토스트와 각 패널의 상태 표시로 전달하도록 했다.
- Agent 설치/업데이트 시 `/opt/remote-game-agent/data` 디렉터리를 보존하도록 했다.
- Agent 실행 환경에 `AGENT_STATE_FILE=/opt/remote-game-agent/data/servers.json`를 추가했다.
- Agent Docker CLI adapter가 관리 컨테이너 목록을 상태 파일에 저장하도록 했다.
- Docker 목록 조회가 실패하면 상태 파일을 읽어 마지막으로 알고 있던 게임 서버 정보를 복원하도록 했다.
- Agent 기대 버전을 `0.1.2`로 올렸다.

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

- Agent 업데이트 모달은 SSH password를 저장하지 않고 작업 시점에만 사용한다.
- 실제 원격 서버에서 업데이트 후 상태 파일 생성과 Docker 컨테이너 목록 복원은 사용자가 직접 테스트해야 한다.

## 다음 단계

- 실제 서버에서 `Agent 업데이트` 모달을 통해 업데이트를 실행한다.
- 업데이트 후 `/opt/remote-game-agent/data/servers.json` 생성 여부와 `Agent 상태 확인` 결과를 확인한다.
