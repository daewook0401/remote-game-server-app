# task_3 트러블슈팅: HAProxy managed block 누적

## 증상

- `/etc/haproxy/haproxy.cfg`에 `# BEGIN remote-game-server ...` 블록이 여러 개 누적된다.
- 같은 내부 서버 `192.168.x.x`에 대해 서버 이름이 다른 block이 남는다.
- `bind 0.0.0.0:18080` 같은 중복 frontend가 생길 수 있다.

## 원인

- HAProxy block ID가 `서버 이름 + 내부 서버 IP` 기반이었다.
- 서버 이름이 한글이거나 변경되면 sanitize 결과가 달라져 기존 block과 다른 block으로 인식됐다.
- 기존 적용/삭제 명령은 같은 `serverId` block만 제거해서 같은 내부 서버의 예전 block을 제거하지 못했다.

## 해결

- HAProxy server id를 내부 서버 host 기반의 stable id로 변경했다.
- HAProxy 적용 시 같은 내부 target host를 포함한 기존 `remote-game-server` managed block도 제거한 뒤 새 block을 쓴다.
- HAProxy 삭제 시에도 `targetHosts`를 넘겨 같은 내부 서버의 예전 managed block을 함께 제거한다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.

## 운영 참고

- 기존에 쌓인 block은 다음 HAProxy route 적용 또는 서버 삭제 시 같은 내부 서버 host 기준으로 정리된다.
