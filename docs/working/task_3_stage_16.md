# task_3 단계 16 보고: 컨테이너 삭제 시 경유 서버 외부 방화벽 정리 추가

## 단계 제목

HAProxy 경유 컨테이너 삭제 방화벽 정리 범위 보강

## 변경 파일

- `apps/desktop/src/components/ContainerDeleteModal.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- 컨테이너 삭제 방화벽 정리에서 내부망 서버 포트만 닫던 흐름에 경유 서버 외부 포트 정리를 추가했다.
- HAProxy 경유 서버면 경유 서버의 HAProxy SSH/sudo password를 추가로 요구한다.
- 내부망 서버 방화벽 정리 후 경유 서버 방화벽 정리를 순서대로 실행한다.
- 경유 서버 방화벽 정리는 `closeRemoteFirewallPort`를 HAProxy 서버 SSH 정보로 호출한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
