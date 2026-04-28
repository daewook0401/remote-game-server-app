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

## 추가 수정

- 서버 생성 시 볼륨 경로가 실제 서버에 생성되지 않는 문제를 방지하기 위해 Agent가 Docker 실행 전에 `/remote-game-server/volume/...` 경로를 직접 생성하고 쓰기 권한을 보장하도록 수정한다.
- 원격 서버 업데이트가 가능하도록 Agent/Desktop 기대 버전을 `0.1.5`로 올린다.
- Desktop이 `volumePath`를 보내지 못한 경우에도 Agent가 Minecraft 컨테이너 이름으로 기본 볼륨 경로를 계산하도록 수정한다.
- Agent/Desktop 기대 버전을 `0.1.6`으로 올린다.

## Snap Docker 볼륨 정책 수정

- Agent가 `docker info --format {{.DockerRootDir}}`로 Docker root dir을 확인한다.
- Docker root dir이 `/var/snap/docker/...`이면 snap Docker로 판단한다.
- snap Docker에서 `/remote-game-server/volume/...` 경로가 들어오면 `/home/{sshUser}/remote-game-server/volume/...`로 보정한다.
- apt/공식 Docker에서는 기존 `/remote-game-server/volume/...` 경로를 유지한다.
- Desktop도 Agent 상태의 `isSnapDocker` 값과 선택 서버의 SSH user를 기준으로 생성 모달의 예상 데이터 경로를 home 경로로 보여준다.
- Agent/Desktop 기대 버전을 `0.1.7`로 올린다.

## UI 정보 구조 피드백 반영

- 첫 화면은 게임 생성이 아니라 서버 선택을 가장 앞에 둔다.
- 첫 실행처럼 서버가 없으면 서버 생성 버튼을 먼저 보여준다.
- 서버를 선택해 들어간 뒤 Agent 설치, Agent 업데이트, Agent 포트 개방, Docker 컨테이너 관리를 한 화면에서 처리한다.
- Docker 컨테이너 영역 오른쪽 위에 게임 서버 추가 버튼을 둔다.
- 게임 서버 추가 버튼을 누르면 게임, 외부 포트, 서버 이름, 메모리, EULA를 설정한다.
- 게임 서버 삭제 시 컨테이너/데이터 삭제 선택과 함께 방화벽 포트 정리 선택지를 제공한다.
