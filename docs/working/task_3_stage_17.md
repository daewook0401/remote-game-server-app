# task_3 단계 17 보고: HAProxy block 누적 방지

## 단계 제목

HAProxy managed block stable id 및 stale block 정리

## 변경 파일

- `apps/desktop/src/services/serverRegistrationModel.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/electron/ssh/haproxyScripts.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/troubleshooting/task_3_haproxy_stale_blocks.md`

## 변경 내용

- `buildProxyServerId`를 서버 이름 기반에서 내부 서버 host 기반으로 변경했다.
- HAProxy apply 명령이 같은 내부 target host를 가진 기존 managed block을 함께 제거하도록 변경했다.
- HAProxy remove 명령이 `targetHosts`를 받아 같은 내부 target host의 stale block을 함께 제거하도록 변경했다.
- 서버 삭제 시 내부 서버 host를 `targetHosts`로 전달한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
