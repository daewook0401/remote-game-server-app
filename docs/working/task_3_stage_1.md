# task_3 stage_1 보고서

## 단계 제목

외부망 HAProxy 경유 접속과 Agent 등록 플로우 구현

## 변경 파일

- `apps/desktop/src/types/server.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/electron/ssh/sshClient.ts`
- `apps/desktop/electron/ssh/haproxyScripts.ts`
- `apps/desktop/electron/services/haproxyService.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/services/haproxyClient.ts`
- `apps/desktop/src/vite-env.d.ts`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`

## 변경 내용

- 서버 접속 경로 모델에 `directSsh`, `jumpSsh`, `directPublic`을 추가했다.
- Agent 접근 방식에 `direct`, `sshTunnel`, `haproxy`를 추가했다.
- 서버 등록 폼에 외부망 HAProxy 노드 정보, 허용 IP/CIDR, Agent proxy port를 추가했다.
- Electron SSH 클라이언트가 점프 노드 경유 SSH 실행을 지원하도록 확장했다.
- 외부망 노드의 HAProxy 설치 확인, 설정 적용, 설정 제거 IPC를 추가했다.
- Agent 설치 후 `jumpSsh` 모드에서는 HAProxy Agent route를 생성하고, Agent API 확인 후에만 등록 가능하게 했다.
- 게임 서버 생성 시 HAProxy 경유 서버는 게임 TCP 포트 route를 HAProxy 설정으로 추가하도록 했다.
- 서버 삭제 시 HAProxy 관리 블록과 방화벽 규칙 제거를 먼저 시도한 뒤 Agent 정리를 수행하게 했다.
- 클릭 가능한 버튼에 pointer/hover/active 상태를 추가하고, 서버 등록 긴 요청 버튼에 pending 상태를 연결했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck` 통과
- `npm run desktop:build` 통과

## 실패 또는 특이사항

- 실제 외부망 노트북/점프 노드와 내부망 서버를 이용한 HAProxy 동작 검증은 사용자의 실서버 테스트 단계로 남긴다.
- UDP route는 HAProxy UDP 지원 설치본 확인을 전제로 하며, 지원 확인 실패 시 등록을 차단하는 정책으로 구현했다.

## 다음 단계

- 사용자가 실제 외부망 경유 노드에서 SSH 확인, Agent 설치, HAProxy route 생성, Agent API 확인, 서버 등록을 수동 테스트한다.
- 테스트 피드백에 따라 HAProxy 설정 템플릿과 오류 메시지를 조정한다.

## 승인 요청

구현 단계는 빌드 검증까지 완료했으며, 실서버 검수 피드백을 기다린다.
