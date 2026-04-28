# task_1 16단계 작업 보고서

## 제목

원격/클라우드 서버 등록과 선택 서버 Agent 연결 흐름

## 변경 파일

- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/ServerCreatePanel.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/server.ts`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/orders/20260428.md`

## 작업 내용

- 원격/클라우드 서버를 등록하는 `ServerRegistrationPanel`을 추가했다.
- `ManagedServer` 모델에 `agentBaseUrl`, SSH host/port/user 정보를 추가했다.
- 서버 카드에서 선택과 Agent 확인을 할 수 있도록 했다.
- 선택된 서버를 화면 상단에 표시하고, 생성/조회/시작/중지/삭제 요청이 선택된 서버의 Agent URL로 전달되도록 했다.
- 생성 패널은 게임, 포트, 메모리, EULA 설정만 담당하도록 정리했다.
- 실행 위치와 SSH 정보는 서버 등록/선택 흐름으로 분리해 중복 입력을 줄였다.
- Agent client 함수들이 기본 로컬 Agent뿐 아니라 전달받은 Agent URL로 요청을 보낼 수 있게 했다.
- 원격 Agent 등록/선택/생성 요청 기준을 기술 문서로 작성했다.

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
npm audit --json
```

결과: 취약점 0개.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

결과: HTTP 200.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -UseBasicParsing
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/containers' -UseBasicParsing
```

결과:

- Docker status HTTP 200
- Docker containers HTTP 200

## 실패 또는 특이사항

- 이번 단계는 실제 SSH 접속이나 클라우드 인스턴스 생성은 수행하지 않았다.
- 현재 서버 등록 정보는 React 상태에만 존재하므로 앱 새로고침 시 초기값으로 돌아간다.
- 원격 Agent URL 호출은 구조만 연결했으며, 실제 원격 서버에서는 Agent 실행, 방화벽, CORS, 인증 설정이 추가로 필요하다.

## 다음 단계

- 등록된 서버 정보를 로컬 저장소에 저장한다.
- SSH 연결 테스트와 Agent 설치/실행 안내 흐름을 추가한다.
- 원격 Agent API 인증 또는 연결 토큰 모델을 설계한다.

## 승인 요청

16단계 작업을 완료했다. 다음 단계에서는 서버 등록 영구 저장과 SSH Agent 설치 확인 흐름을 이어서 진행하면 된다.
