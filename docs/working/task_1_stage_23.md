# task_1 23단계 작업 보고서

## 제목

원격 서버 선택/삭제, Minecraft 생성 전 검증, Linux Agent Release 배포

## 변경 파일

- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/ServerCreatePanel.tsx`
- `apps/desktop/src/components/ServerCreateReadinessPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/server.ts`
- `docs/working/task_1_stage_23.md`
- `docs/orders/20260428.md`

## 작업 내용

- 서버 카드에 삭제 버튼을 추가했다.
- 선택된 서버를 삭제하면 다음 서버를 자동 선택하고, 컨테이너/Agent 상태를 초기화하도록 했다.
- Minecraft 서버 생성 전 체크리스트 패널을 추가했다.
- 생성 전 확인 항목은 서버 선택, Agent 확인, 실제 Docker CLI mode, 원격 Agent 연결, 서버 이름, 포트, EULA 동의로 구성했다.
- 실제 원격 테스트 혼선을 줄이기 위해 Docker CLI mode가 확인되지 않으면 서버 생성 버튼을 비활성화하도록 했다.
- 컨테이너 테이블에 `instanceId` 표시 컬럼을 추가했다.
- 생성 성공 후 서버 카드에 `Minecraft 생성 요청 완료` 메시지가 반영되도록 했다.
- SSH 자동 설치용 Linux Agent 바이너리를 GitHub Release asset으로 배포하기로 했다.

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
.\scripts\build-agent-linux.ps1
docker build -t remote-game-agent:test services/agent
```

결과: 성공.

```powershell
npm audit --json
```

결과: 취약점 0개.

```powershell
UTF-8 scan
```

결과: `UTF8_ISSUES=0`.

## 실패 또는 특이사항

- 실제 원격 서버 접속과 Minecraft 컨테이너 생성은 사용자가 보유한 원격 서버에서 직접 테스트할 예정이다.
- 생성 버튼은 실제 Docker CLI mode가 확인되어야 활성화된다.

## 다음 단계

- 실제 원격 서버 테스트 피드백을 받아 SSH/Agent/Docker/Minecraft 생성 흐름을 보정한다.
- 테스트 결과에 따라 서버 카드 상태, 콘솔 로그, 컨테이너 목록 갱신 UX를 강화한다.

## 승인 요청

23단계 작업과 Linux Agent Release 배포를 완료한 뒤, 실제 원격 서버 테스트 피드백을 반영하면 된다.
