# task_3 트러블슈팅: Agent 설치 후 API Failed to fetch

## 증상

- Agent 설치/업데이트 결과는 `실행 성공`, `포트 열림`으로 나오지만 `API 접근 불가`, `버전 확인 불가`, `Docker 확인 불가`가 표시된다.
- 서버 등록 시 `Failed to fetch`가 표시된다.

## 판단

- Agent 프로세스 자체는 설치되어 실행 중일 가능성이 높다.
- 앱에서 `http://중계서버:18080/docker/status`로 접근하지 못하는 상태다.

## 확인된 원인 후보

- `허용 IP/CIDR`에 `203.0.113.10/32` 같은 문서 예시용 IP가 들어가 있으면 실제 PC의 접속이 HAProxy ACL 또는 방화벽에서 차단된다.
- HAProxy 중계 서버의 18080 포트가 외부에서 열려 있지 않을 수 있다.
- HAProxy route가 내부 서버 `192.168.219.105:18080`으로 연결하지 못할 수 있다.

## 조치

- 서버 추가 모달이 화면보다 길 때 스크롤 가능하도록 수정했다.
- `허용 IP/CIDR` placeholder를 예시 IP 대신 `비우면 전체 허용, 제한 시 내 공인 IP/32`로 바꿨다.
- 문서 예시용 CIDR 대역이 입력되면 HAProxy route 적용과 서버 등록 전에 차단하고 안내하도록 했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.

## 다음 확인

- `허용 IP/CIDR`을 비우고 다시 `Agent 포트 설정` 또는 `Agent 설치`를 실행한다.
- 제한이 필요하면 실제 접속 PC의 공인 IP를 `/32`로 입력한다.
