# task_3 단계 8 보고: Agent 설치 버튼 클릭 이벤트 전달 차단

## 단계 제목

Agent 설치 버튼의 React 클릭 이벤트 IPC 유입 차단

## 변경 파일

- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/troubleshooting/task_3_agent_install_click_event_clone_error.md`

## 변경 내용

- `Agent 설치` 버튼이 클릭 이벤트 객체를 `handlePrepareAgent`에 넘기지 않도록 `onClick={() => onPrepareAgent()}`로 변경했다.
- 서버 등록 패널의 다른 주요 버튼도 같은 형태로 감쌌다.
- `handlePrepareAgent`에서 `passwordOverride`가 문자열이 아니면 무시하도록 방어했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.

## 다음 단계

- 사용자가 앱에서 `Agent 설치` 버튼을 다시 눌러 clone 오류가 사라졌는지 확인한다.
