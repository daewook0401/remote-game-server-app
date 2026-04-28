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
- SSH 접속 정보: host, port, user
- Agent URL: 예시 `http://127.0.0.1:18080`
- Agent 상태
- Docker 준비 상태

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

## 다음 구현 후보

- 서버 등록 정보를 로컬 저장소에 영구 저장한다.
- SSH 연결 테스트와 Agent 설치 스크립트 안내를 추가한다.
- 클라우드 서버 생성 버튼은 provider별 플러그인 또는 Terraform/CLI 가이드로 분리한다.
- 원격 Agent가 CORS 또는 인증 설정을 갖도록 Agent 설정 모델을 추가한다.
