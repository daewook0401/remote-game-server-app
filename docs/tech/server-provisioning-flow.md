# 서버 생성과 Docker 확인 흐름

## 생성 흐름

```text
실행 위치 선택
-> 게임 선택
-> 포트/메모리/EULA 설정
-> Agent에 생성 요청
-> Agent가 Docker 컨테이너 생성
-> Agent가 Docker label/inspect/logs로 생성 여부 확인
```

## 실행 위치

- `지금 PC`: 현재 실행 중인 PC의 Agent가 Docker를 제어한다.
- `SSH 서버`: SSH 정보로 대상 서버를 등록하고 Agent 설치/연결을 확인한다.
- `클라우드 서버`: 클라우드 인스턴스 생성 또는 기존 인스턴스 SSH 연결 후 Agent를 설치/연결한다.

## SSH 정보 처리 기준

초기 구조에서는 SSH로 Docker 명령을 계속 실행하지 않는다.

권장 흐름:

```text
Desktop
-> SSH로 Agent 설치 또는 실행 확인
-> Agent HTTP API 연결
-> Agent가 Docker 상태 조회와 컨테이너 제어 수행
-> Desktop은 Agent API 응답으로 상태 표시
```

이 방식이 필요한 이유:

- SSH 명령 출력은 OS, shell, 권한, Docker 설치 방식에 따라 쉽게 달라진다.
- 로그, 콘솔, FRP 실행, 컨테이너 상태 조회는 Agent가 서버 안에서 담당하는 편이 안정적이다.
- Desktop은 Agent API라는 일정한 계약만 바라볼 수 있다.

## Docker 생성 확인 기준

컨테이너 생성 시 label을 붙인다.

```text
remote-game-server.managed=true
remote-game-server.instanceId={instanceId}
remote-game-server.templateId={gameTemplateId}
remote-game-server.targetType={targetType}
```

확인에 사용할 Docker 명령:

```powershell
docker ps -a --filter "label=remote-game-server.managed=true"
docker ps -a --filter "label=remote-game-server.instanceId=minecraft-java-minecraft-survival"
docker inspect <container-id>
docker logs --tail 80 <container-id>
docker port <container-id>
```

Agent는 위 결과를 정규화해서 Desktop에 반환한다.

## 현재 구현된 확인 흐름

현재 단계에서 Agent는 다음 API로 관리 컨테이너 목록을 반환한다.

```http
GET /docker/containers
```

동작 기준:

- Memory mode: Agent 메모리에 생성된 컨테이너 요약 목록을 반환한다.
- Docker CLI mode: `remote-game-server.managed=true` label이 붙은 Docker 컨테이너를 `docker ps -a`로 조회한다.
- Desktop: `Agent 상태 확인` 또는 `컨테이너 새로고침`을 누르면 Agent 목록을 다시 받아 화면의 Docker 컨테이너 테이블을 갱신한다.

SSH나 클라우드 대상은 장기적으로 SSH 명령 결과를 직접 파싱하지 않고, 대상 서버에 설치된 Agent API 응답을 통해 같은 형식의 컨테이너 목록을 가져오는 방향으로 유지한다.
