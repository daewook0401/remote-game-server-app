# 원격/클라우드 서버 등록 흐름

## 목적

사용자가 Minecraft 서버를 만들 위치를 먼저 등록하고, 이후 생성/조회/시작/중지/삭제 요청이 선택된 서버의 Agent API로 전달되도록 한다.

## 현재 UI 흐름

```text
서버 등록
-> 서버 카드 선택
-> Agent 확인
-> 게임/포트/메모리 설정
-> 서버 생성
-> 컨테이너 새로고침
```

## 서버 등록 정보

Desktop은 등록된 서버마다 다음 정보를 가진다.

- 서버 이름
- 서버 유형: `local`, `remote`, `cloud`
- 운영체제: Ubuntu, Windows, macOS, Fedora, Arch, 기타 Linux
- SSH 접속 정보: host, port, user
- SSH 인증 방식: password 또는 key
- SSH key path
- Agent URL: 예시 `http://127.0.0.1:18080`
- Agent token
- Agent 상태
- Docker 준비 상태

## 로컬 저장 기준

Electron 실행 환경에서는 등록된 서버 목록을 앱의 `userData` 경로 아래 `servers.json`에 저장한다.

브라우저 개발 환경에서는 Electron preload API가 없으므로 `localStorage` fallback을 사용한다.

현재 저장 대상:

- 서버 이름
- 서버 유형
- 운영체제
- SSH host/port/user/key path
- SSH 인증 방식
- Agent URL
- Agent token
- 마지막 Agent/Docker 상태

주의:

- 현재 MVP 저장소는 JSON 기반이다.
- Agent token과 SSH key path는 민감 정보에 가깝기 때문에, 배포 단계에서는 OS 보안 저장소 또는 암호화 저장소로 옮기는 것이 맞다.

## Agent 연결 방식

서버 생성과 컨테이너 관리는 SSH 명령을 직접 반복 실행하지 않고, 선택된 서버의 Agent URL로 HTTP API를 호출한다.

예시:

```text
Local Agent: http://127.0.0.1:18080
AWS Agent: http://203.0.113.10:18080
Internal Agent: http://192.168.219.105:18080
```

선택된 서버가 바뀌면 Desktop은 해당 서버의 컨테이너 목록을 비우고, 사용자가 `Agent 확인` 또는 `컨테이너 새로고침`을 눌렀을 때 해당 Agent에서 목록을 다시 가져온다.

## 생성 요청 기준

Minecraft 생성 요청은 선택된 서버의 Agent URL로 전송한다.

```text
Desktop
-> selectedServer.agentBaseUrl
-> POST /docker/minecraft
-> Agent
-> Docker
```

요청 payload에는 선택된 서버 기준의 `serverId`, `targetType`, SSH 정보가 포함된다. 장기적으로 SSH 정보는 Agent 설치/부트스트랩 단계에서 사용하고, Docker 제어는 Agent API를 통해 유지한다.

## SSH 연결 테스트 기준

SSH 서버 정보는 사용자가 입력한다.

필수 입력:

- SSH host
- SSH port
- SSH user
- 운영체제
- SSH 인증 방식

선택 입력:

- 패스워드 인증: SSH password
- 키 인증: SSH key path

현재 단계에서는 Electron main process IPC에서 실제 SSH 접속을 수행하고, 등록 화면에서 선택한 운영체제와 원격 서버에서 감지한 운영체제가 맞는지 비교한다.

권장 흐름:

```text
Renderer UI
-> ssh:test IPC
-> Electron main process
-> ssh2 라이브러리로 password 또는 key 인증 접속
-> OS 감지 명령 실행
-> 선택한 OS와 감지한 OS 비교
-> Docker 설치/실행 가능 여부 확인
-> Agent 포트 18080 listen 여부 확인
-> Desktop에서 Agent URL API 접근 가능 여부 확인
-> Renderer UI에 결과 표시
```

OS 감지 기준:

- Ubuntu/Fedora/Arch/기타 Linux: `/etc/os-release`
- macOS: `sw_vers`, `uname`
- Windows: PowerShell OS 정보

SSH password는 접속 테스트에만 사용하고 저장하지 않는다. SSH key path는 서버 등록 정보에 저장할 수 있다.

## Docker와 Agent 확인 기준

SSH 접속이 성공하면 Electron main process는 원격 서버에서 다음 상태를 함께 확인한다.

- Docker CLI 설치 여부: `docker --version`
- Docker daemon 접근 가능 여부: `docker info`
- Agent 포트 listen 여부: `18080` 포트 확인

이후 Renderer는 등록된 Agent URL로 `/docker/status`를 호출해 현재 PC에서 Agent API에 접근 가능한지도 확인한다.

판단 예시:

```text
SSH 접속 성공 · OS 일치(linux-ubuntu) · Docker 준비됨 · Agent 포트 열림 · Agent API 접근 가능
```

Agent 포트가 열려 있어도 방화벽, 보안 그룹, NAT, 바인딩 주소 때문에 Desktop에서 Agent API 접근이 실패할 수 있다. 그래서 서버 내부 포트 확인과 Desktop에서의 Agent URL 접근 확인을 분리한다.

## Agent 준비 기준

Linux 서버에서는 `Agent 준비` 버튼으로 다음 작업을 수행한다.

- `/opt/remote-game-agent/agent` 존재 확인
- Agent가 없으면 등록 화면의 Agent 다운로드 URL에서 바이너리 다운로드
- 실행 권한 부여
- `.env` 생성
- systemd service 생성 또는 fallback `nohup` 실행
- Agent 포트 `18080` listen 확인
- Desktop에서 Agent URL `/docker/status` 접근 확인

자세한 배포 기준은 [Linux Agent 배포 흐름](./linux-agent-distribution.md)을 따른다.

## 서버 카드 반영

SSH 확인 또는 Agent 준비 결과는 서버 카드의 상태에 반영한다.

- Agent 준비 성공: `connected`, `ready`
- Agent API 접근 불가: Agent 상태 `offline`
- Docker 미설치: Docker 상태 `needsSetup`

Docker가 설치되지 않은 서버는 등록 화면 아래에 OS별 Docker 설치 안내를 표시한다.

## 다음 구현 후보

- SSH 연결 테스트 결과를 바탕으로 Agent 설치/실행 명령 안내를 추가한다.
- 클라우드 서버 생성 버튼은 provider별 플러그인 또는 Terraform/CLI 가이드로 분리한다.
- Agent token을 OS 보안 저장소 또는 암호화 저장소로 옮긴다.
