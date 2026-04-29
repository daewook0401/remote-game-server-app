# task_3 단계 10 보고: Agent 확인 버튼 제거 후 등록 문구 정리

## 단계 제목

서버 등록 및 생성 readiness 문구 정리

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/serverReadiness.ts`
- `docs/feedback/task_3_remove_agent_check_button_copy.md`

## 변경 내용

- 서버 등록 실패 문구에서 `Agent 확인` 버튼 기준 표현을 제거했다.
- 서버 등록은 `Agent 설치 후 API 접근이 확인되어야 등록 가능`하다는 기준으로 안내한다.
- 서버 등록 성공 시 `Agent API 접근 확인 완료`로 상태를 저장하고, 연결 상태를 반영한다.
- 서버 생성 readiness 문구를 `Agent API 자동 확인` 기준으로 변경했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
