# task_1 단계별 보고서: 2단계 프로젝트 기본 구조 생성

## 단계 제목

Electron + React + TypeScript, Go Agent, Go Relay 기본 구조 생성

## 변경 파일

- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `apps/desktop/package.json`
- `apps/desktop/index.html`
- `apps/desktop/tsconfig.json`
- `apps/desktop/tsconfig.electron.json`
- `apps/desktop/vite.config.ts`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/vite-env.d.ts`
- `services/agent/go.mod`
- `services/agent/cmd/agent/main.go`
- `services/agent/internal/frp/config.go`
- `services/relay/go.mod`
- `services/relay/cmd/relay/main.go`
- `services/relay/internal/ports/allocator.go`
- `docs/guides/udp-guide.md`
- `docs/guides/nginx-stream-guide.md`
- `docs/guides/port-forwarding-guide.md`
- `docs/orders/20260428.md`
- `docs/working/task_1_stage_2.md`

## 변경 내용

- 루트 npm workspace를 구성했다.
- 설치형 프로그램 UI 기본 구조를 `apps/desktop`에 생성했다.
- Electron main/preload 엔트리를 추가했다.
- React 기반 초기 프로그램 화면을 추가했다.
- Agent 기본 Go 모듈과 FRP client 설정 렌더링 코드를 추가했다.
- Relay 기본 Go 모듈과 포트 할당 API 스캐폴딩을 추가했다.
- UDP, Nginx Stream, 직접 포트포워딩 안내 가이드를 추가했다.
- npm 의존성을 설치하고 `package-lock.json`을 생성했다.
- Electron audit 취약점이 발견되어 Electron 버전을 `^41.3.0`으로 올렸다.
- TypeScript 프로젝트 참조 설정 오류를 수정했다.

## 실행한 검증 명령

```powershell
node --version
npm --version
go version
git status --short
```

```powershell
npm install
npm run desktop:typecheck
npm audit --json
npm run desktop:build
```

```powershell
Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--port','5173') -WorkingDirectory 'C:\develop\side-project\game_saas\apps\desktop' -WindowStyle Hidden -PassThru
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
```

```powershell
$files=Get-ChildItem -Recurse -File -Include *.md,*.json,*.ts,*.tsx,*.css,*.html,*.go,*.mod,*.yml,*.yaml -Exclude package-lock.json | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\dist-electron\\' }
$utf8=New-Object System.Text.UTF8Encoding($false,$true)
foreach ($file in $files) {
  try {
    $bytes=[System.IO.File]::ReadAllBytes($file.FullName)
    $text=$utf8.GetString($bytes)
    if ($text.Contains([char]0xFFFD)) {
      "REPLACEMENT $($file.FullName)"
    } else {
      "OK $($file.FullName)"
    }
  } catch {
    "FAIL $($file.FullName): $($_.Exception.Message)"
  }
}
```

## 검증 결과

- Node.js `v24.11.1` 확인
- npm `11.11.0` 확인
- `npm install` 성공
- 최초 `npm audit`에서 Electron 취약점 1건 확인
- Electron `^41.3.0` 업데이트 후 `npm audit` 취약점 0건 확인
- 최초 `npm run desktop:typecheck`에서 `tsconfig` 프로젝트 참조 설정 오류 확인
- `tsconfig.json` 수정 후 `npm run desktop:typecheck` 성공
- `npm run desktop:build` 성공
- `apps/desktop` 기준 Vite dev server 실행 성공
- `http://127.0.0.1:5173` HTTP 200 응답 확인
- 응답 HTML에서 `Remote Game Server` 문구 확인
- 생성한 주요 문서와 소스 파일 UTF-8 strict 검증 성공

## 실패 또는 특이사항

- 현재 환경에는 Go가 설치되어 있지 않거나 PATH에 없다.
- 따라서 `go test`, `go build`, `gofmt`는 실행하지 못했다.
- 현재 작업 공간에서는 실제 TCP 접속 수동 검증을 수행하지 않았다.
- 최초 dev server 실행을 루트 workspace 스크립트로 시도했을 때 `http://127.0.0.1:5173`에서 404가 발생했다.
- 이후 해당 프로세스를 정리하고 `apps/desktop` 작업 디렉터리에서 Vite를 실행해 HTTP 200을 확인했다.
- `node_modules`, `dist`, `dist-electron`은 생성되었지만 `.gitignore` 대상이다.
- 현재 Git 상태는 아직 커밋되지 않은 신규 파일 상태다.

## 다음 단계

3단계에서 MVP 흐름의 실제 기능 단위를 시작한다.

예상 작업:

- Desktop UI에서 공개 시작/중지 상태 모델 정의
- Agent의 FRP 설정 생성 로직 테스트 보강
- Relay 포트 할당 로직 테스트 보강
- Go 설치 또는 CI 환경 기준 확정 후 Go 검증 실행

## 승인 요청

2단계 프로젝트 기본 구조 생성을 승인하고, 3단계 MVP 기능 흐름 구현을 진행해도 되는지 승인을 요청한다.
