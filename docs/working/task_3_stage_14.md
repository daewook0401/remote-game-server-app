# task_3 단계 14 보고: HAProxy 경유 서버 삭제 비밀번호 분리

## 단계 제목

서버 삭제 시 내부망 서버와 경유 서버 비밀번호 분리

## 변경 파일

- `apps/desktop/src/components/ServerDeleteModal.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- 서버 삭제 대상 상태에 `haproxyPassword`를 추가했다.
- HAProxy 경유 서버 삭제 모달에서 내부망 서버 SSH password와 경유 서버 HAProxy SSH password를 별도로 입력받는다.
- HAProxy route/외부 포트 정리는 경유 서버 비밀번호를 사용한다.
- 내부 Agent/내부 방화벽 정리는 내부망 서버 비밀번호를 사용한다.
- 경유 서버가 password 인증인데 비밀번호가 없으면 삭제를 차단하고 안내한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
