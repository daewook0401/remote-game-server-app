# task_3 트러블슈팅: Agent 설치 시 IPC clone 오류

## 증상

- SSH 확인은 성공하지만 `Agent 설치` 버튼을 누르면 화면에 `An object could not be cloned.` 오류가 표시된다.

## 원인

- SSH 명령 실행 중 발생한 오류 객체가 Electron IPC를 통과할 때 복제 불가능한 내부 속성을 포함할 수 있다.
- 이 경우 실제 SSH 또는 설치 실패 메시지가 사용자에게 전달되기 전에 IPC 직렬화 단계에서 오류가 발생한다.

## 해결

- Electron IPC 핸들러에서 서비스 오류를 `Error(message)` 형태로 정규화해 renderer로 전달하도록 변경했다.
- Agent HAProxy route 생성 시 `허용 IP/CIDR` 빈 값은 전체 허용 정책으로 동작하도록 기존 필수 검사를 제거했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.

## 재발 방지

- SSH, HAProxy, Agent처럼 외부 라이브러리 오류가 직접 올라오는 IPC는 복제 가능한 메시지 형태로 정규화한다.
