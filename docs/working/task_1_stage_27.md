# task_1 27단계 작업 보고서

## 제목

저장된 SSH 서버 기반 Agent 업데이트 흐름 보정

## 변경 파일

- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_27.md`

## 작업 내용

- Agent 설치/업데이트가 SSH password 방식일 때 SSH password를 sudo 입력으로 재사용하도록 했다.
- Agent 바이너리를 실행 중인 파일에 바로 덮어쓰지 않고, 임시 파일로 다운로드한 뒤 서비스 중지, 교체, 재시작 순서로 처리하도록 했다.
- SSH 한 줄 실행에서 깨지던 heredoc(`<<EOF`)을 제거하고, `printf | sudo tee` 방식으로 `.env`와 systemd service 파일을 쓰도록 수정했다.
- Agent 설치/업데이트 직후 `/docker/status`를 다시 조회해 버전과 Docker mode가 맞을 때만 업데이트 완료로 표시하도록 했다.
- 저장된 서버를 선택하면 SSH host, port, user, 인증 방식, key path, Agent URL, token을 등록 폼에 자동 반영하도록 했다.
- SSH password는 저장하지 않고 선택 시마다 빈 값으로 유지해, 사용자가 작업 시점에만 다시 입력하도록 했다.

## 검증 명령과 결과

```powershell
npm run desktop:typecheck
npm run desktop:build
```

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
```

실행 위치: `services/agent`

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
```

실행 위치: `services/relay`

결과: 성공.

```powershell
npm audit --json
UTF-8 scan
```

결과: 취약점 0개, `UTF8_ISSUES=0`.

## 다음 단계

- 저장된 서버를 선택하고 SSH password만 입력한 뒤 `Agent 설치/업데이트`를 실행해 실제 원격 업데이트를 확인한다.
