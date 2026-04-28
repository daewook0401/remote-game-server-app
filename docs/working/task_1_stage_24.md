# task_1 24단계 작업 보고서

## 제목

sudo 경고 기반 서버 내부 방화벽 포트 설정

## 변경 파일

- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/services/firewallService.ts`
- `apps/desktop/electron/ssh/sshClient.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/firewallClient.ts`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/vite-env.d.ts`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_24.md`

## 작업 내용

- 서버 등록 영역에 `Agent 포트 설정` 버튼을 추가했다.
- 포트 설정을 처음 누르면 sudo 관리자 권한 경고를 먼저 표시하도록 했다.
- 사용자가 다시 확인하면 SSH password를 sudo 입력으로 재사용해 서버 내부 방화벽의 Agent API 포트를 설정하도록 했다.
- Electron IPC에 `firewall:openPort` 채널을 추가했다.
- SSH 명령 실행 중 stdin 입력을 전달할 수 있도록 `runSshCommandWithInput`을 추가했다.
- Linux 서버에서 `ufw`, `firewall-cmd`, `iptables` 순서로 사용 가능한 방화벽 도구를 찾아 `Agent URL`의 포트, 기본 `18080/tcp`를 열도록 했다.
- SSH password 인증이 아닌 경우에는 자동 sudo 포트 설정을 막고 안내 메시지를 표시하도록 했다.
- 클라우드 보안 그룹, 공유기 포트포워딩 등 서버 외부 방화벽은 별도 수동 설정이 필요하다는 경고를 표시하도록 했다.

## 검증 명령과 결과

```powershell
npm run desktop:typecheck
```

결과: 성공.

## 실패 또는 특이사항

- 실제 원격 서버의 sudo 권한과 방화벽 변경은 사용자가 보유한 서버에서 직접 테스트해야 한다.
- 이 기능은 서버 내부 OS 방화벽만 다룬다. AWS Security Group, 클라우드 방화벽, 공유기 포트포워딩은 별도 수동 설정이 필요할 수 있다.

## 다음 단계

- 실제 원격 서버에서 포트 설정 결과를 확인한다.
- 필요하면 포트 오픈 후 외부 TCP 접근 테스트와 클라우드별 수동 가이드를 연결한다.
