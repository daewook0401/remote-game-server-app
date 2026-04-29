# task_3 트러블슈팅: SSH authentication methods failed

## 증상

- `agent:prepare` 또는 `haproxy:apply` 실행 중 `All configured authentication methods failed` 오류가 발생한다.

## 의미

- `agent:prepare`에서 발생하면 실제 Agent 설치 대상 서버 SSH 인증 실패다.
- `haproxy:apply`에서 발생하면 HAProxy 중계 서버 SSH 인증 실패다.

## 원인 후보

- SSH user, password, port가 실제 서버와 다르다.
- 서버가 일반 `password` 인증 대신 `keyboard-interactive` 인증만 허용한다.
- 키 인증을 선택했지만 키 경로가 틀렸거나 서버에 공개키가 등록되어 있지 않다.

## 조치

- ssh2 클라이언트 옵션에 `tryKeyboard`를 추가했다.
- password 인증 시 `keyboard-interactive` 프롬프트에도 같은 비밀번호를 전달하도록 보강했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.
