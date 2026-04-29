# task_3 트러블슈팅: 컨테이너 삭제 방화벽 정리 handshake timeout

## 증상

- Docker 컨테이너 삭제의 방화벽 포트 정리 단계에서 `Timed out while waiting for handshake`가 발생한다.

## 원인

- HAProxy 경유 서버인데 내부망 서버 방화벽 정리 요청이 내부망 서버로 직접 SSH 접속을 시도했다.
- 내부망 서버는 경유 서버를 통해서만 접근 가능하므로 직접 SSH handshake가 타임아웃된다.

## 해결

- 컨테이너 삭제 대상에 현재 서버 정보를 포함했다.
- HAProxy 경유 서버의 컨테이너 삭제 방화벽 정리 단계에서 내부망 서버 password와 경유 서버 HAProxy password를 분리해 입력받는다.
- 내부 방화벽 정리 SSH 요청에 jump host, jump port, jump user, jump auth 정보를 포함하도록 변경했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.
