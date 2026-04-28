# task_1 19단계 작업 보고서

## 제목

SSH 접속 후 Docker와 Agent 상태 확인

## 변경 파일

- `apps/desktop/electron/main.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/types/server.ts`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/working/task_1_stage_19.md`
- `docs/orders/20260428.md`

## 작업 내용

- SSH 테스트가 운영체제 감지만 수행하던 흐름을 확장했다.
- Electron main process의 SSH 테스트 명령에서 Docker 설치 여부를 확인하도록 했다.
- `docker info` 실행 결과로 Docker daemon 접근 가능 여부를 확인하도록 했다.
- 원격 서버 내부에서 Agent 포트 `18080`이 listen 중인지 확인하도록 했다.
- Renderer에서 SSH 테스트 후 등록된 Agent URL의 `/docker/status` API 접근 가능 여부를 추가로 확인하도록 했다.
- SSH 테스트 결과 메시지에 OS, Docker, Agent 포트, Agent API 접근 상태를 함께 표시하도록 했다.
- 서버 내부 포트 상태와 Desktop에서의 Agent API 접근 상태는 다를 수 있음을 문서화했다.

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
npm audit --json
```

결과: 취약점 0개.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

결과: HTTP 200.

## 실패 또는 특이사항

- 실제 외부 SSH 서버 접속은 사용자의 서버 정보가 필요하므로 수행하지 않았다.
- Agent 포트 listen 여부와 Desktop에서 Agent API 접근 가능 여부는 별도로 판단한다.
- 원격 Agent가 `127.0.0.1`에만 바인딩되어 있으면 서버 내부 포트는 열려 있어도 외부 Desktop 접근은 실패할 수 있다.

## 다음 단계

- Linux Agent 바이너리 cross build 스크립트를 추가한다.
- Agent Dockerfile과 Docker 이미지 실행 가이드를 추가한다.
- SSH 테스트 결과에 따라 Agent 설치/실행 명령을 UI에 표시한다.

## 승인 요청

19단계 작업을 완료했다. 다음 단계에서는 Linux Agent 배포물과 Docker 이미지 구성을 진행하면 된다.
