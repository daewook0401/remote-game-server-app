# Remote Game Server App

개인 PC, 홈서버, 클라우드 서버에서 게임 서버를 쉽게 만들고 관리하기 위한 데스크톱 프로그램입니다.  
전문 지식이 적은 사용자도 서버를 등록하고, Agent를 설치한 뒤, Docker 기반 게임 서버를 생성하고 외부 접속 포트를 열 수 있게 만드는 것을 목표로 합니다.

## 주요 목표

- 웹 UI가 아닌 설치형 데스크톱 프로그램으로 제공
- 로컬 PC 또는 SSH 원격 서버를 등록해서 관리
- Linux 서버에 Agent를 설치하거나 업데이트
- Docker 컨테이너 기반 게임 서버 생성, 시작, 중지, 삭제
- Minecraft Java 서버 생성 지원
- 원격 서버의 Agent 포트와 게임 포트 방화벽 개방 지원
- 서버별 볼륨 경로를 고정해 월드 데이터 유지
- 추후 FRP 기반 Relay/Jump 서버 방식으로 NAT 내부 서버 공개 지원

## 현재 구현된 흐름

1. 데스크톱 앱에서 서버를 등록합니다.
   - 내 로컬 서버
   - SSH 원격 서버
   - 클라우드 서버
2. 서버 카드에서 `들어가기`를 눌러 서버 상세 화면으로 이동합니다.
3. 상세 화면에서 Agent 상태 확인, 설치, 업데이트, Agent 포트 개방을 진행합니다.
4. Docker 컨테이너 영역에서 게임 서버를 추가합니다.
5. 서버 이름, 외부 포트, 메모리, EULA 동의를 입력하고 Minecraft 서버를 생성합니다.
6. 생성된 컨테이너를 시작, 중지, 삭제하거나 콘솔 명령을 보낼 수 있습니다.

## 기술 스택

- Desktop: Electron, React, TypeScript, Vite
- Agent: Go
- Container: Docker CLI
- Remote Access: SSH
- Tunnel 계획: FRP
- 문서: Markdown, Korean

## 프로젝트 구조

```text
apps/
  desktop/      Electron + React 데스크톱 앱
services/
  agent/        사용자 서버에서 실행되는 Go Agent
  relay/        추후 Relay/Jump 서버 제어 API
docs/
  guides/       사용자 안내 가이드
  working/      작업 계획 및 진행 기록
scripts/        빌드와 배포 보조 스크립트
```

## 개발 실행

```bash
npm install
npm run desktop:dev
```

Electron 실행이 필요한 기능은 브라우저 단독 Vite 화면이 아니라 Electron 앱에서 테스트해야 합니다.  
SSH, Agent 설치, 방화벽 설정, 로컬 저장소 접근 같은 기능은 Electron preload와 main process를 통해 동작합니다.

## 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
go test ./...
npm audit --json
```

Windows에서 `go`가 PATH에 잡히지 않으면 기본 설치 경로를 직접 사용할 수 있습니다.

```powershell
& "C:\Program Files\Go\bin\go.exe" test ./...
```

## Agent

Agent는 원격 Linux 서버 내부에서 실행되는 작은 Go 프로그램입니다. 데스크톱 앱은 SSH로 서버에 접속해 Agent를 설치하거나 업데이트하고, 이후 Agent API를 통해 Docker 상태와 컨테이너 목록을 조회합니다.

기본 Agent 포트:

```text
18080/tcp
```

Agent 설치 및 업데이트는 GitHub Release의 Linux 바이너리를 내려받아 교체하는 방식입니다. 이미 Agent가 설치된 서버라도 새로 설치하면 기존 바이너리를 교체하고, 게임 서버 데이터는 Docker 볼륨 경로에 남도록 설계합니다.

## 데이터 경로

게임 서버 데이터는 서버 내부의 고정 볼륨 경로에 저장됩니다.

```text
/remote-game-server/volume/{game}/{server-name}
```

Snap Docker 환경에서는 bind mount 제약을 피하기 위해 사용자 홈 디렉터리 아래 경로를 사용합니다.

```text
/home/{sshUser}/remote-game-server/volume/{game}/{server-name}
```

## 방화벽 처리

원격 서버에서 포트를 열 때는 sudo 권한이 필요할 수 있습니다. 앱은 작업 시점에 SSH 비밀번호를 입력받고, 해당 작업에만 사용합니다.

- Agent 포트: `18080/tcp`
- Minecraft Java 기본 내부 포트: `25565/tcp`
- 게임 서버 외부 포트: 사용자가 입력

컨테이너 삭제 시에는 방화벽 규칙을 유지할지, 허용 규칙을 삭제할지, 차단 규칙을 추가할지 선택할 수 있도록 확장 중입니다.

## 향후 계획

- FRP 기반 Relay/Jump 서버 연결
- UDP 게임 서버 지원
- Nginx Stream 방식은 자동 수정 대신 사용자 안내 가이드 제공
- 더 쉬운 서버 등록 마법사 UI
- Agent 설치와 Docker 설치 가이드 고도화
- Windows/macOS 서버 Agent 지원 검토

## 현재 상태

이 프로젝트는 실제 제품화를 목표로 시작된 초기 개발 단계입니다. 현재는 Minecraft Java 서버 생성과 원격 Linux Agent 관리 흐름을 우선 구현하고 있으며, 사용자가 직접 원격 서버에서 테스트하면서 UI와 동작을 빠르게 개선하고 있습니다.
