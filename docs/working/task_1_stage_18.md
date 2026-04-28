# task_1 18단계 작업 보고서

## 제목

SSH 운영체제 선택, 패스워드/키 인증, 원격 OS 비교

## 변경 파일

- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/package.json`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/data/serverManagement.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/serverStorage.ts`
- `apps/desktop/src/services/sshClient.ts`
- `apps/desktop/src/types/server.ts`
- `apps/desktop/src/vite-env.d.ts`
- `docs/tech/remote-agent-registration-flow.md`
- `docs/working/task_1_stage_18.md`
- `package-lock.json`

## 작업 내용

- 서버 등록 화면에 운영체제 선택을 추가했다.
- 운영체제 선택지는 Linux/Ubuntu, Windows, macOS, Linux/Fedora, Linux/Arch, 기타 Linux로 구성했다.
- SSH 인증 방식을 패스워드와 키 파일 중 선택할 수 있게 했다.
- 패스워드 인증 입력을 추가했다. 패스워드는 접속 테스트에만 사용하고 서버 저장 모델에는 넣지 않았다.
- 키 인증 입력은 기존 SSH key path를 사용하도록 했다.
- Electron preload에 `ssh:test` IPC를 추가했다.
- Electron main process에서 `ssh2` 라이브러리로 실제 SSH 접속 테스트를 수행하도록 했다.
- 원격 서버에서 OS 감지 명령을 실행하고, 사용자가 선택한 OS와 비교하도록 했다.
- 이전 단계에서 저장된 서버 데이터에 `osType`, `sshAuthMethod`가 없더라도 기본값으로 보정되도록 했다.
- 서버 카드에 등록된 OS 정보를 표시하도록 했다.
- 관련 문서를 OS 비교와 인증 방식 기준으로 보강했다.

## 검증 명령과 결과

```powershell
npm run desktop:typecheck
```

결과: 성공.

```powershell
npm run desktop:build
```

결과: 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' test ./...
```

실행 위치:

- `services/agent`
- `services/relay`

결과: 모두 성공.

```powershell
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/agent
& 'C:\Program Files\Go\bin\go.exe' build ./cmd/relay
```

결과: 모두 성공.

```powershell
npm audit --json
```

결과: 취약점 0개.

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

결과: HTTP 200.

```powershell
UTF-8 인코딩 스캔
```

결과: `UTF8_ISSUES=0`.

## 실패 또는 특이사항

- 실제 외부 SSH 서버 접속은 사용자의 서버 정보가 필요하므로 수행하지 않았다.
- 브라우저 개발 실행에서는 Electron IPC가 없으므로 SSH 테스트를 사용할 수 없다.
- 패스워드는 저장하지 않는다. 키 경로와 Agent token은 현재 저장 대상이므로, 배포 단계에서는 보안 저장소로 옮겨야 한다.

## 다음 단계

- SSH 테스트 결과에 Docker 설치 여부 확인을 추가한다.
- SSH 테스트 결과에 Agent 실행 여부와 Agent URL 접근 가능 여부를 추가한다.
- Linux Agent 바이너리와 Docker 이미지 배포 스크립트/가이드를 추가한다.

## 승인 요청

18단계 작업을 완료했다. 다음 단계에서는 SSH 접속 후 Docker/Agent 설치 상태 확인과 Linux Agent 배포물을 진행하면 된다.
