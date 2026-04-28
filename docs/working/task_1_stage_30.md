# Task 1 Stage 30: Minecraft 콘솔 연결

## 단계 제목

Agent Docker 콘솔 로그 조회와 명령 전송 연결

## 목표

- 저장된 서버를 선택해 Agent API에 연결한다.
- 관리 중인 Minecraft 컨테이너 목록을 불러온다.
- 선택한 컨테이너의 최근 로그를 조회한다.
- 콘솔 입력창에서 Minecraft 명령을 전송한다.

## 구현 방향

- Agent에 콘솔 명령 실행 API를 추가한다.
- Docker CLI 모드에서는 `docker exec {containerId} rcon-cli {command}`로 Minecraft 서버에 명령을 전달한다.
- Desktop 콘솔 페이지는 저장된 서버와 컨테이너를 선택할 수 있게 한다.
- 명령 전송 후 콘솔 로그를 다시 갱신한다.

## 변경 예정 파일

- `apps/desktop/src/pages/ConsolePage.tsx`
- `apps/desktop/src/services/agentClient.ts`
- `apps/desktop/src/types/api.ts`
- `services/agent/internal/api/server.go`
- `services/agent/internal/api/server_test.go`
- `services/agent/internal/docker/adapter.go`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/contracts_test.go`
- `services/agent/internal/docker/memory_adapter.go`
- `services/agent/internal/docker/service.go`

## 검증 방법

- UTF-8 인코딩 확인
- Desktop TypeScript typecheck
- Desktop build
- Agent Go test
- Linux Agent binary build

## 상태

완료

## 실행한 검증 명령

- `npm run desktop:typecheck`
- `npm run desktop:build`
- `go test ./...` (`services/agent`)
- `powershell -ExecutionPolicy Bypass -File scripts/build-agent-linux.ps1`
- `npm audit --json`

## 검증 결과

- Desktop TypeScript typecheck 성공.
- Desktop production build 성공.
- Agent Go test 성공.
- Linux Agent binary build 성공.
- npm audit 취약점 0개.
