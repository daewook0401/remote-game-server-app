# task_3 단계 12 보고: 서버 등록 버튼 Agent API 게이트 적용

## 단계 제목

서버 등록 버튼 내부 Agent API 확인 강제

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- 서버 등록 버튼을 누르면 `register` pending 상태와 안내 메시지를 먼저 표시한다.
- 외부망 HAProxy 경유 서버는 등록 버튼 안에서 Agent HAProxy route를 다시 적용한다.
- 그 다음 Agent API `/docker/status`를 호출한다.
- Agent API 응답이 성공해야만 서버를 등록한다.
- 등록 성공 시 확인한 Agent 상태를 저장하고 현재 화면 상태에도 반영한다.
- 실패 시 등록하지 않고 Agent API 접근 실패 메시지를 표시한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
