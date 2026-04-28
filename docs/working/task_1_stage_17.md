# task_1 17단계 작업 보고서

## 제목

서버 등록 로컬 저장과 Agent 토큰 인증 모델

## 변경 파일

- `services/agent/cmd/agent/main.go`
- `services/agent/internal/api/server.go`
- `services/agent/internal/api/server_test.go`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/vite-env.d.ts`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/services/httpClient.ts`
- `apps/desktop/src/services/serverStorage.ts`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/server.ts`
- `docs/tech/agent-docker-control.md`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/orders/20260428.md`

## 작업 내용

- Electron main process에 서버 목록 로드/저장 IPC를 추가했다.
- 등록된 서버 목록을 Electron `userData/servers.json`에 저장하도록 했다.
- 브라우저 개발 실행에서는 `localStorage` fallback을 사용하도록 했다.
- Desktop 서버 등록 정보에 SSH key path와 Agent token을 추가했다.
- 서버 등록 UI에 SSH key path, Agent token 입력을 추가했다.
- SSH 입력 확인 버튼을 추가했다. 현재는 실제 접속 전 필수 입력값 검증만 수행한다.
- Agent client가 Agent token을 Bearer 헤더로 보낼 수 있도록 했다.
- Agent 서버에 `AGENT_TOKEN` 기반 선택형 인증을 추가했다.
- `AGENT_TOKEN`이 설정된 경우 `/docker/*` API는 `Authorization: Bearer ...` 헤더를 요구한다.
- `/healthz`는 헬스체크 용도로 토큰 없이 접근 가능하게 유지했다.

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

결과: 모두 성공. Agent 테스트에서 토큰 미설정, 토큰 누락 401, Bearer 토큰 성공 케이스를 확인했다.

```powershell
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
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

- 이번 단계에서는 실제 SSH 접속을 실행하지 않았다.
- SSH 서버 정보는 사용자가 입력해야 한다.
- 현재 SSH 입력 확인은 host/port/user가 채워졌는지 확인하는 수준이다.
- Agent token은 현재 JSON 저장 대상이다. 배포 단계에서는 OS 보안 저장소 또는 암호화 저장소로 옮겨야 한다.

## 다음 단계

- Electron main process에서 실제 SSH 연결 테스트 IPC를 구현한다.
- SSH key path 파일 선택 UI를 추가한다.
- 원격 서버에서 Agent 설치 여부와 Docker 설치 여부를 확인하는 명령 계약을 추가한다.
- 서버 등록 저장소를 JSON에서 SQLite 또는 보안 저장소 조합으로 발전시킨다.

## 승인 요청

17단계 작업을 완료했다. 다음 단계에서는 실제 SSH 연결 테스트와 Agent 설치 확인 흐름을 진행하면 된다.
