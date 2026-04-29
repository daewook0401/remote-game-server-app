# task_3 단계 7 보고: Agent 설치 IPC 오류 보정

## 단계 제목

Agent 설치 버튼 오류 메시지 전달 보정

## 변경 파일

- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/src/services/serverRegistrationModel.ts`
- `docs/troubleshooting/task_3_agent_install_ipc_clone_error.md`

## 변경 내용

- Electron IPC 핸들러에 공통 오류 정규화 래퍼를 추가했다.
- SSH/Agent/HAProxy 작업 중 발생한 복제 불가능한 오류 객체를 그대로 renderer로 넘기지 않고 문자열 메시지를 가진 `Error`로 변환한다.
- `허용 IP/CIDR`을 비우면 전체 허용으로 동작한다는 정책에 맞춰 Agent HAProxy 요청 생성의 필수 검사를 제거했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.

## 다음 단계

- 사용자가 같은 입력으로 `Agent 설치`를 다시 눌러 실제 SSH/설치 실패 원인 또는 성공 결과를 확인한다.
