# OpenServerHub

OpenServerHub는 로컬 PC, SSH로 접근 가능한 Linux 서버, 그리고 외부망 경유 노드를 통해 접근해야 하는 내부망 서버의 게임 서버를 등록하고 운영하기 위한 데스크톱 프로그램입니다.

목표는 단순합니다. 서버를 연결하고, Agent를 설치하고, Docker 상태를 확인한 뒤, 게임 서버 컨테이너를 생성하고, 필요한 포트를 열고, 실행 중인 서버를 한 화면에서 관리할 수 있게 만드는 것입니다.

영문 문서는 [README.md](README.md)를 참고하세요.

## 현재 구현된 기능

- Electron + React 기반 데스크톱 앱
- 서버 목록, 서버 상세, 도움말 중심의 서버 우선 관리 UI
- 로컬 서버 및 SSH Linux 서버 등록
- 외부망 HAProxy 노드를 통해 내부망 서버에 접근하는 경유 모드
- 직접 SSH 및 경유 SSH 접속 확인
- Linux Agent 설치, 업데이트, 삭제, 토큰 기반 Agent API 접근
- Agent API 접근이 확인되어야 서버 등록 가능
- Agent를 통한 Docker CLI 상태 확인 및 컨테이너 제어
- Minecraft Java 서버 생성
- EULA 동의, 메모리, 포트, 볼륨 경로 설정
- 컨테이너 시작, 중지, 삭제, 콘솔 로그 조회, 콘솔 명령 전송
- 내부망 서버 방화벽 포트 개방 및 정리
- Agent 포트와 게임 포트에 대한 HAProxy TCP 라우트 생성 및 삭제
- 경유 노드의 HAProxy 설치 여부 감지와 설치 안내
- 컨테이너 삭제, 방화벽 규칙, HAProxy 게임 라우트, 등록 서버, 원격 Agent 데이터 정리 흐름

## 동작 방식

OpenServerHub는 크게 데스크톱 앱과 Agent로 구성됩니다.

데스크톱 앱은 사용자의 PC에서 실행됩니다. 등록된 서버 정보를 로컬에 저장하고, Electron main process를 통해 SSH 작업을 수행하며, 서버 Agent API와 통신합니다.

Agent는 관리 대상 서버 내부에서 실행됩니다. Docker 상태 확인, 관리 컨테이너 목록 조회, Minecraft 컨테이너 생성, 콘솔 로그 조회, 콘솔 명령 전송, 컨테이너 삭제 같은 기능을 작은 HTTP API로 제공합니다.

내부망 서버처럼 사용자의 PC에서 직접 접근할 수 없는 서버는 외부망 HAProxy 노드를 경유할 수 있습니다. 이 경우 데스크톱 앱은 외부 노드에 SSH로 접속해 TCP 프록시 라우트를 적용하고, 외부 방화벽 포트를 열고, HAProxy 주소를 통해 내부 Agent 또는 게임 서버에 접근합니다.

## 기본 사용 흐름

1. 데스크톱 앱을 실행합니다.
2. **서버 추가**를 누릅니다.
3. 접속 경로를 선택합니다.
   - 직접 SSH 서버
   - 외부망 HAProxy 경유 내부망 서버
4. **SSH 확인**을 실행합니다.
5. Agent 설치 또는 업데이트와 Agent 포트 설정을 진행합니다.
6. Agent API 접근이 확인되면 서버를 등록합니다.
7. 등록된 서버 상세 화면으로 들어갑니다.
8. Minecraft Java 서버를 생성합니다.
9. 컨테이너 시작, 중지, 콘솔, 삭제 기능으로 서버를 관리합니다.

HAProxy 경유 모드에서 게임 서버를 생성하면 내부망 서버의 게임 포트가 열리고, 외부망 HAProxy TCP 라우트가 적용되며, 경유 서버의 방화벽 포트가 열립니다. 컨테이너 삭제 시에는 방화벽 규칙을 정리하고, Agent 라우트는 유지한 채 해당 게임 포트 라우트만 제거할 수 있습니다.

## 현재 지원 게임

현재 구현된 게임 템플릿은 Minecraft Java입니다.

게임 데이터는 서버 내부의 고정 볼륨 경로에 유지됩니다.

```text
/remote-game-server/volume/{game}/{server-name}
```

Snap Docker 환경에서는 bind mount 제약을 피하기 위해 사용자 홈 디렉터리 아래 경로를 사용합니다.

```text
/home/{sshUser}/remote-game-server/volume/{game}/{server-name}
```

## 보안 방식

Agent는 인증 없이 외부에 공개하는 것을 전제로 하지 않습니다. OpenServerHub는 설정 과정에서 Agent 토큰을 발급하고 저장한 뒤, Agent API 요청에 토큰을 사용합니다.

원격 Linux 작업 중 sudo 권한이 필요한 작업은 실행 시점에 SSH 또는 sudo 비밀번호를 입력받습니다. 이 비밀번호는 해당 작업에만 사용하며 등록된 서버 정보로 저장하지 않습니다.

HAProxy 경유 서버에서는 내부망 서버와 외부망 경유 노드 양쪽에 방화벽 및 라우트 변경 권한이 필요할 수 있으므로, 작업에 따라 두 개의 비밀번호 입력이 필요할 수 있습니다.

## 개발 실행

의존성 설치:

```bash
npm install
```

데스크톱 개발 실행:

```bash
npm run desktop:dev
```

SSH, Agent 설치, 방화벽 변경, 로컬 저장소 접근 같은 기능은 Electron 환경에서 동작합니다. 브라우저 단독 Vite 화면에서는 모든 기능을 검증할 수 없습니다.

타입 검사와 빌드:

```bash
npm run desktop:typecheck
npm run desktop:build
```

Go 테스트:

```bash
cd services/agent
go test ./...
```

```bash
cd services/relay
go test ./...
```

## 프로젝트 구조

```text
apps/
  desktop/      Electron, React, TypeScript, Vite 데스크톱 앱
services/
  agent/        관리 대상 서버에 설치되는 Go Agent
  relay/        실험적 Relay 서비스 영역
docs/
  plans/        계획서
  working/      단계별 작업 기록
  feedback/     피드백 및 결정 기록
  troubleshooting/
scripts/        빌드 및 보조 스크립트
```

## AI와의 협업 방식

OpenServerHub는 AI 페어 프로그래밍 방식으로 개발하고 있습니다. 사람 작업자는 방향, 아키텍처, 승인, 최종 테스트를 소유합니다. AI 협업자는 구현 계획을 작성하고, 승인 후 코드를 수정하며, 작업 문서를 남기고, 로컬 검증을 수행하고, 실제 서버 테스트에서 나온 피드백에 대응합니다.

이 협업 방식은 프로젝트의 여러 결정에 직접 반영되었습니다.

- 기능 중심 사이드바를 서버 우선 구조로 변경
- 서버 상세 진입 시 Agent 상태를 자동 확인
- 메인 내비게이션에서 외부 공개 기능 제거
- 내부망 서버 테스트 이후 HAProxy 경유 기능 추가
- 실제 실패 사례를 바탕으로 방화벽, Agent, HAProxy 라우트 정리 흐름 개선
- 유지보수성을 위해 큰 UI 파일을 컴포넌트와 서비스로 분리

`docs/` 아래에는 계획서, 작업 기록, 피드백, 트러블슈팅 문서를 남겨 구현 판단의 흐름을 추적할 수 있도록 했습니다.
