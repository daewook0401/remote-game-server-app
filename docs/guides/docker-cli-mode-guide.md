# Docker CLI mode 실행 가이드

Agent는 기본적으로 실제 Docker를 조작하지 않는 memory mode로 실행된다.

실제 Docker 컨테이너를 생성/시작/중지/삭제하려면 Docker CLI mode를 명시적으로 켜야 한다.

## 실행 전 확인

- Docker Desktop 또는 Docker Engine이 실행 중인지 확인한다.
- `docker version` 명령이 성공하는지 확인한다.
- Minecraft 서버 생성 시 EULA 동의가 필요하다.
- `docker run`, `docker stop`, `docker rm -f`는 실제 컨테이너 상태를 변경한다.
- Desktop UI에서는 Docker CLI mode일 때 생성/시작/중지/삭제 작업에 확인 단계를 거친다.

## 실행 방법

```powershell
cd C:\develop\side-project\game_saas\services\agent
$env:AGENT_DOCKER_MODE='cli'
$env:AGENT_DOCKER_PATH='docker'
& 'C:\Program Files\Go\bin\go.exe' run ./cmd/agent
```

## 상태 확인

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:18080/docker/status' -UseBasicParsing
```

응답 예시:

```json
{
  "available": true,
  "mode": "cli",
  "message": "docker cli is available"
}
```

## 되돌리기

memory mode로 돌아가려면 Agent를 종료한 뒤 환경 변수를 제거하고 다시 실행한다.

```powershell
Remove-Item Env:AGENT_DOCKER_MODE -ErrorAction SilentlyContinue
Remove-Item Env:AGENT_DOCKER_PATH -ErrorAction SilentlyContinue
& 'C:\Program Files\Go\bin\go.exe' run ./cmd/agent
```
