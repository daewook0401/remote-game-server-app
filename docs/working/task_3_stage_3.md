# task_3 stage_3 보고서

## 단계 제목

HAProxy 설치 승인 흐름 추가 및 `ServerManagementPage.tsx` 추가 분리

## 변경 파일

- `apps/desktop/electron/ssh/haproxyScripts.ts`
- `apps/desktop/electron/services/haproxyService.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/services/haproxyClient.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/components/AgentUpdateModal.tsx`
- `apps/desktop/src/components/ContainerDeleteModal.tsx`
- `docs/feedback/task_3_haproxy_install_flow.md`
- `docs/feedback/task_3_split_first_rule.md`

## 변경 내용

- 외부망 경유 노드에서 HAProxy가 없으면 즉시 설치하지 않고 설치 확인 모달을 표시하도록 변경했다.
- 설치 모달에서 sudo 비밀번호를 입력받고, 승인 후에만 HAProxy 설치를 시도한다.
- 설치 스크립트는 `/etc/os-release`와 패키지 매니저를 감지한다.
- 지원 패키지 매니저는 `apt-get`, `dnf`, `yum`, `pacman`, `zypper`, `apk`다.
- 설치 후 `haproxy -vv`를 다시 확인한다.
- Agent 업데이트 모달을 `AgentUpdateModal.tsx`로 분리했다.
- 컨테이너 삭제 모달을 `ContainerDeleteModal.tsx`로 분리했다.
- `ServerManagementPage.tsx`는 약 1591줄까지 줄였다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck` 통과
- `npm run desktop:build` 통과

## 실패 또는 특이사항

- 실제 HAProxy 설치는 실서버에서 sudo 권한과 패키지 매니저 상태에 따라 검증이 필요하다.
- SSH key 인증 환경에서도 sudo 비밀번호가 필요한 서버가 있을 수 있어 설치 모달에서 별도 비밀번호를 받도록 했다.

## 다음 단계

- 실서버에서 HAProxy 미설치 상태 감지, 설치 모달, 설치 후 재확인 흐름을 검수한다.
- 추가 분리는 서버 상세 패널과 컨테이너 생성/삭제 상태 관리 훅으로 이어갈 수 있다.

## 승인 요청

HAProxy 설치 승인 흐름과 추가 분리는 빌드 검증까지 완료했다.
