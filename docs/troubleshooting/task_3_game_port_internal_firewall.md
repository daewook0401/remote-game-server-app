# task_3 트러블슈팅: HAProxy 경유 게임 포트 내부망 방화벽 누락

## 증상

- 외부망 HAProxy 포트는 열렸지만 게임 접속이 되지 않는다.
- 내부망 서버에서 `ufw status`를 보면 게임 포트가 열려 있지 않다.

## 원인

- HAProxy 경유 구조에서는 외부망 포트와 내부망 서버 포트가 모두 열려야 한다.
- 기존 흐름은 HAProxy route만 적용하고 내부망 서버의 게임 호스트 포트 방화벽 개방을 생략했다.

## 해결

- 게임 생성 전에 내부망 서버의 게임 호스트 포트를 먼저 개방한다.
- 그 다음 HAProxy route를 적용한다.
- HAProxy backend는 내부망 서버의 호스트 공개 포트로 연결한다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.
