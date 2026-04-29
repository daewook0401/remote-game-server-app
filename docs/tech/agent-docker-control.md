# Agent Docker 제어 경계

## 목적

Agent는 설치형 프로그램의 명령을 받아 사용자 서버의 Docker 컨테이너를 생성하고 관리한다.

이번 단계에서는 실제 Docker 실행을 무조건 수행하지 않고, Docker adapter 경계를 먼저 만든다. 기본 실행 모드는 메모리 adapter이며, 환경 변수로 Docker CLI adapter를 선택할 수 있다.

## 실행 모드

### Memory mode

기본 모드다.

```text
AGENT_DOCKER_MODE 미설정
```

특징:

- 실제 Docker 명령을 실행하지 않는다.
- 테스트와 UI 연결 확인에 사용한다.
- `/docker/status`에서 `mode: memory`를 반환한다.

### Docker CLI mode

```text
AGENT_DOCKER_MODE=cli
AGENT_DOCKER_PATH=docker
```

사용자가 직접 실행할 때는 [Docker CLI mode 실행 가이드](../guides/docker-cli-mode-guide.md)를 따른다.

특징:

- Docker CLI를 통해 컨테이너를 제어한다.
- Minecraft 서버 생성 시 `docker run` 명령을 실행한다.
- 관리 대상 컨테이너 목록은 `remote-game-server.managed=true` label 기준으로 조회한다.
- 컨테이너 시작/중지/삭제 시 `docker start`, `docker stop`, `docker rm -f`를 사용한다.
- 콘솔 snapshot은 `docker logs --tail 80`을 사용한다.

## Agent API

### 선택형 Agent 토큰

Agent 실행 시 `AGENT_TOKEN`을 설정하면 `/docker/*` API는 Bearer 토큰을 요구한다.

```powershell
$env:AGENT_TOKEN="<example-agent-token>"
go run ./cmd/agent
```

Desktop은 서버 등록 정보의 `Agent token` 값을 요청 헤더에 넣는다.

```http
Authorization: Bearer <example-agent-token>
```

`AGENT_TOKEN`이 비어 있으면 기존처럼 인증 없이 동작한다. `/healthz`는 헬스체크 용도로 토큰 없이 접근 가능하다.

### Docker 상태

```http
GET /docker/status
```

응답:

```json
{
  "available": true,
  "mode": "memory",
  "message": "memory docker adapter is active"
}
```

Desktop의 `Agent 설치 확인` 버튼은 이 API를 호출해 Docker mode와 message를 화면에 표시한다.

### 관리 컨테이너 목록

```http
GET /docker/containers
```

응답:

```json
[
  {
    "id": "mc-minecraft-survival",
    "name": "minecraft-survival",
    "image": "itzg/minecraft-server",
    "status": "running",
    "port": 25565,
    "instanceId": "minecraft-java-minecraft-survival"
  }
]
```

Docker CLI mode에서 사용하는 조회 기준:

```text
docker ps -a --filter label=remote-game-server.managed=true --format ...
```

Desktop의 `컨테이너 새로고침` 버튼은 이 API를 호출해 화면 목록을 Agent 기준으로 다시 맞춘다.

### Minecraft 서버 생성

```http
POST /docker/minecraft
Content-Type: application/json

{
  "serverId": "local",
  "targetType": "local",
  "gameTemplateId": "minecraft-java",
  "instanceId": "minecraft-java-minecraft-survival",
  "containerName": "minecraft-survival",
  "image": "itzg/minecraft-server",
  "internalPort": 25565,
  "externalPort": 25565,
  "memory": "2G",
  "eulaAccepted": true
}
```

Docker CLI mode에서 생성되는 명령 구조:

```text
docker run -d --name minecraft-survival \
  --label remote-game-server.managed=true \
  --label remote-game-server.instanceId=minecraft-java-minecraft-survival \
  --label remote-game-server.templateId=minecraft-java \
  --label remote-game-server.targetType=local \
  -e EULA=TRUE -e MEMORY=2G -p 25565:25565 itzg/minecraft-server
```

## 주의사항

- Docker CLI mode는 실제 컨테이너를 생성하거나 삭제할 수 있으므로 명시적으로 켠 경우에만 사용한다.
- Minecraft 서버 생성에는 EULA 동의가 필요하다.
- 현재 단계에서는 Docker CLI 명령 인자 생성과 adapter 경계를 검증했고, 실제 Minecraft 이미지 pull/run은 수행하지 않았다.
