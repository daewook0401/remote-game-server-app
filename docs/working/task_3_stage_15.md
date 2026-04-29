# task_3 단계 15 보고: 컨테이너 삭제 방화벽 정리 점프 SSH 적용

## 단계 제목

HAProxy 경유 컨테이너 삭제 시 내부망 방화벽 정리 SSH 경로 보정

## 변경 파일

- `apps/desktop/src/components/ContainerDeleteModal.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/troubleshooting/task_3_container_delete_firewall_jump_timeout.md`

## 변경 내용

- 컨테이너 삭제 모달 상태에 서버 정보와 `haproxyPassword`를 추가했다.
- 경유 서버가 password 인증이면 방화벽 정리 단계에서 경유 서버 HAProxy SSH password를 추가로 받는다.
- 내부망 방화벽 포트 정리 요청에 jump SSH 정보를 포함했다.
- 내부망 서버 password는 sudo 및 내부 서버 SSH 인증에 사용하고, 경유 서버 password는 jump SSH 인증에 사용한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
