# MVP 공개 흐름

## 범위

MVP는 Minecraft Java TCP `25565`를 대상으로 Agent + FRP 방식의 점프 접속 흐름을 우선 구현한다.

다만 제품의 핵심 흐름은 단순 공개가 아니라 서버 생성과 관리까지 포함한다.

- 로컬 서버에서 Minecraft Docker 컨테이너 생성
- 기존 원격 서버 또는 클라우드 서버 연결
- Agent 설치 또는 연결 확인
- Docker 컨테이너 시작/중지/삭제
- Docker 로그와 콘솔 접근
- 필요 시 Agent + FRP로 외부 공개

## 서버 생성/관리 흐름

```text
대상 환경 선택
-> 서버 접속 정보 등록 또는 로컬 Agent 확인
-> Docker 상태 확인
-> Minecraft 템플릿 선택
-> 컨테이너 생성
-> 로그/콘솔 확인
-> 외부 공개 시작
```

대상 환경:

- 로컬 서버
- 기존 원격 서버
- 클라우드 서버

원격 서버 등록에 필요한 정보:

- SSH host
- SSH port
- 사용자명
- 인증 방식
- Agent 설치 여부

Docker 관리 기능:

- 컨테이너 생성
- 컨테이너 시작
- 컨테이너 중지
- 컨테이너 삭제
- 로그 조회
- 콘솔 접속

상세한 서버 생성 위치 선택, SSH 연결, Docker label 기반 확인 방식은 [서버 생성과 Docker 확인 흐름](server-provisioning-flow.md)을 따른다.

## Desktop 화면 구조

초기 화면은 외부 공개가 아니라 서버 관리가 중심이다.

- `서버 관리`: 로컬/원격/클라우드 서버 등록, Agent 상태, Docker 상태, Minecraft 템플릿, 컨테이너 목록
- `콘솔`: Docker 컨테이너 로그와 명령 입력
- `외부 공개`: Agent + FRP 공개 시작/중지와 접속 주소
- `안내 가이드`: 클라우드 SSH, Agent 설치, UDP, Nginx Stream, 포트포워딩 안내

## Agent Docker 계약 초안

Minecraft 서버 생성 요청:

```json
{
  "serverId": "local",
  "containerName": "minecraft-survival",
  "image": "itzg/minecraft-server",
  "port": 25565,
  "memory": "2G",
  "eulaAccepted": true
}
```

컨테이너 작업 요청:

```json
{
  "containerId": "mc-01",
  "action": "start"
}
```

## Agent API 초안

Agent는 사용자 서버에서 로컬 HTTP API를 제공한다.

기본 주소:

```text
http://127.0.0.1:18080
```

엔드포인트:

- `GET /healthz`
- `GET /docker/status`
- `POST /docker/minecraft`
- `POST /docker/containers/action`
- `POST /docker/containers/console`

Docker 제어는 adapter 경계로 분리한다.

- 기본: memory adapter
- 선택: Docker CLI adapter

Docker CLI adapter는 `AGENT_DOCKER_MODE=cli`일 때 사용한다.

## Desktop Client 초안

Desktop은 다음 client 계층을 통해 통신한다.

- `agentClient`: Agent의 Docker 서버 생성/컨테이너 작업/콘솔 snapshot 호출
- `relayClient`: Relay API의 포트 할당/회수 호출
- `httpClient`: JSON POST 공통 처리

## Console snapshot 흐름

Desktop 콘솔 화면은 선택된 컨테이너 ID로 Agent API를 호출한다.

```http
POST /docker/containers/console
Content-Type: application/json

{
  "containerId": "mc-minecraft-survival"
}
```

응답:

```json
{
  "containerId": "mc-minecraft-survival",
  "lines": [
    "[agent] console attach requested",
    "[agent] memory docker adapter is active",
    "> "
  ]
}
```

현재 단계는 streaming attach가 아니라 snapshot 기반이다.

## 컨테이너 action 흐름

Desktop 서버 관리 화면의 컨테이너 작업 버튼은 Agent API를 호출한다.

```http
POST /docker/containers/action
Content-Type: application/json

{
  "containerId": "mc-minecraft-survival",
  "action": "stop"
}
```

지원 action:

- `start`
- `stop`
- `delete`

삭제는 UI에서 한 번 더 확인한 뒤 요청한다.

Docker CLI mode에서는 생성, 시작, 중지, 삭제 모두 UI에서 한 번 더 확인한 뒤 요청한다.

## Docker 제어 경계

세부 내용은 [Agent Docker 제어 경계](agent-docker-control.md)를 따른다.


## 상태 흐름

공개 상태 흐름:

```text
idle -> allocating -> published -> stopping -> idle
```

현재 Desktop UI는 로컬 상태 모델로 다음 값을 표현한다.

- `idle`: 공개 전
- `allocating`: Relay 포트 할당중
- `published`: 공개됨
- `stopping`: 공개 중지중
- `failed`: 실패

## Relay API 초안

### 포트 할당

```http
POST /ports/allocate
```

응답:

```json
{
  "port": 31001
}
```

### 포트 회수

```http
POST /ports/release
Content-Type: application/json

{
  "port": 31001
}
```

성공 응답:

```http
204 No Content
```

## Desktop 외부 공개 흐름

Desktop 외부 공개 화면은 Relay API와 연결된다.

```text
공개 시작 클릭
-> POST /ports/allocate
-> remotePort 저장
-> relay.example.com:remotePort 표시
```

```text
공개 중지 클릭
-> POST /ports/release
-> remotePort 제거
-> 상태 idle로 복귀
```

개발 서버에서 브라우저가 Agent/Relay API를 호출할 수 있도록 두 API 서버는 `http://127.0.0.1:5173`에 대한 CORS 응답 헤더를 제공한다.

## Agent FRP 설정 요청 초안

```json
{
  "gameInstanceId": "server-1",
  "gameName": "minecraft-java",
  "internalPort": 25565,
  "remotePort": 31001,
  "protocol": "tcp",
  "relayHost": "relay.example.com",
  "relayPort": 7000
}
```

Agent는 위 요청을 받아 `frpc` 설정으로 변환한다.
