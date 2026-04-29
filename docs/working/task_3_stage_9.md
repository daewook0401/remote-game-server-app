# task_3 단계 9 보고: SSH keyboard-interactive 인증 지원

## 단계 제목

SSH 인증 실패 케이스 보강

## 변경 파일

- `apps/desktop/electron/ssh/sshClient.ts`
- `docs/troubleshooting/task_3_ssh_auth_methods_failed.md`

## 변경 내용

- password 인증 요청에 `tryKeyboard` 옵션을 추가했다.
- SSH 서버가 keyboard-interactive 인증을 요구하면 입력된 password를 프롬프트 응답으로 전달하도록 했다.
- 이 변경은 Agent 설치 대상 서버와 HAProxy 중계 서버 접속 모두에 적용된다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.

## 다음 단계

- 같은 서버 정보로 `Agent 설치`와 HAProxy route 적용을 다시 시도한다.
