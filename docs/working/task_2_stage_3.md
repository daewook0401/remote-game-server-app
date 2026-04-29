# task_2 단계 3 보고서

## 단계 제목

Agent token 자동 생성/적용 및 서버 삭제 시 Agent 정리 흐름 추가

## 변경 파일

- `apps/desktop/electron/types.ts`
- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/vite-env.d.ts`
- `apps/desktop/src/services/agentBootstrapClient.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- 원격/클라우드 Agent 설치 시 Agent token이 비어 있으면 앱에서 32바이트 난수 토큰을 자동 생성하도록 추가했다.
- 자동 생성한 토큰을 Agent 설치 요청의 `AGENT_TOKEN`에 적용하고, 로컬 서버 저장 정보에도 반영되도록 연결했다.
- 원격/클라우드 서버 등록 UI에서 Agent token 원문 입력 대신 `Agent 인증` 상태를 표시하도록 변경했다.
- Electron main/preload/renderer 경로에 원격 Agent 삭제 IPC를 추가했다.
- 원격 Agent 삭제 명령은 Agent 서비스 중지, systemd 서비스 비활성화/삭제, 프로세스 종료, `18080/tcp` 서버 내부 방화벽 규칙 삭제, `/opt/remote-game-agent` 삭제 순서로 구성했다.
- 서버 삭제 모달을 추가해 `앱 등록 정보만 삭제` 또는 `원격 Agent와 데이터까지 삭제`를 선택할 수 있게 했다.
- 원격 Agent 정리 실패 시 로컬 등록 정보는 자동 삭제하지 않고 오류를 표시하도록 처리했다.

## 실행한 검증 명령

```powershell
npm run desktop:typecheck
```

```powershell
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck`: 성공
- `npm run desktop:build`: 성공

## 실패 또는 특이사항

- 실제 원격 서버에서 Agent 삭제, UFW/firewalld 규칙 삭제, 클라우드 보안 그룹 정리는 사용자 수동 테스트 단계에서 확인한다.
- 클라우드 보안 그룹과 공유기 포트포워딩은 서버 내부 명령으로 닫을 수 없으므로 UI 안내와 문서 기준으로 남겼다.

## 다음 단계

- 사용자가 실제 서버로 최종 수동 테스트를 진행한다.
- 테스트 피드백에 따라 `docs/feedback/` 또는 `docs/troubleshooting/`에 기록하고 후속 수정한다.

## 승인 요청

3단계 구현 완료 보고드립니다.

최종 수동 테스트 후 피드백을 요청드립니다.
