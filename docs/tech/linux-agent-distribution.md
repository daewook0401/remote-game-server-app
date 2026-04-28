# Linux Agent 배포 흐름

## 목적

SSH로 접근 가능한 Linux 서버에서 Agent가 없으면 다운로드하고, 있으면 실행 상태만 확인한 뒤 Desktop이 Agent API로 연결할 수 있게 한다.

## 배포 산출물

### Linux 바이너리

```powershell
.\scripts\build-agent-linux.ps1
```

결과:

```text
dist/agent-linux-amd64
```

GitHub Release에 업로드할 기본 파일명은 `agent-linux-amd64`로 둔다.

현재 단계에서는 자동 업로드를 수행하지 않는다. Release 업로드는 사용자가 별도로 승인한 뒤 진행한다.

### Docker 이미지

```powershell
docker build -t remote-game-agent:latest services/agent
```

실행 예시:

```bash
docker run -d \
  --name remote-game-agent \
  --restart unless-stopped \
  -p 18080:18080 \
  -e AGENT_TOKEN=change-me \
  -e AGENT_ADDR=0.0.0.0:18080 \
  -e AGENT_DOCKER_MODE=cli \
  -e AGENT_DOCKER_PATH=docker \
  -v /var/run/docker.sock:/var/run/docker.sock \
  remote-game-agent:latest
```

## SSH Bootstrap 흐름

Desktop의 `Agent 준비` 버튼은 Linux 서버에서 다음 절차를 수행한다.

```text
SSH 접속
-> /opt/remote-game-agent 생성
-> /opt/remote-game-agent/agent 확인
-> 없으면 Agent 다운로드
-> chmod +x
-> /opt/remote-game-agent/.env 생성
-> systemd service 생성
-> remote-game-agent 재시작
-> 18080 listen 확인
-> Desktop에서 Agent URL /docker/status 확인
```

기본 설치 경로:

```text
/opt/remote-game-agent/
  agent
  .env
```

systemd service:

```text
/etc/systemd/system/remote-game-agent.service
```

## Agent 실행 환경

```bash
AGENT_TOKEN=change-me
AGENT_ADDR=0.0.0.0:18080
AGENT_DOCKER_MODE=cli
AGENT_DOCKER_PATH=docker
```

`AGENT_ADDR=0.0.0.0:18080`은 외부 Desktop에서 Agent API로 접근하기 위해 필요하다. 방화벽, 보안 그룹, 라우터 정책에서 18080 접근이 허용되어야 한다.

## 제한사항

- 현재 자동 준비는 Linux 서버만 지원한다.
- `sudo` 권한이 필요할 수 있다.
- Docker가 설치되어 있지 않으면 Agent는 설치될 수 있지만 게임 컨테이너 생성은 실패한다.
- Agent API를 외부에 노출할 때는 `AGENT_TOKEN`을 설정해야 한다.
