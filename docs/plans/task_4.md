# task_4 Electron 및 프로젝트 하드코딩 정리 수행계획서

## 작업 제목

Electron SSH command 하드코딩 정리 및 프로젝트 기본값 구조화

## 목표

`apps/desktop/electron` 폴더의 `.ts` 파일에 직접 박혀 있는 shell command, 경로, 포트, 서비스명, HAProxy marker, sentinel 문자열을 체계적으로 분류하고 정리한다.

추가로 Electron 외의 renderer, Agent, relay 프로젝트에도 같은 제품 기본값이 흩어져 있는지 검사하고, 같은 값은 한 곳에서 관리할 수 있는 구조를 설계한다.

목표는 단순히 문자열을 한 파일로 옮기는 것이 아니라 다음을 만족하는 구조로 바꾸는 것이다.

- 바뀔 수 있는 값은 설정 또는 상수로 분리한다.
- shell script는 목적별 builder/fragment로 분리한다.
- command 출력 sentinel은 파서와 함께 정의해 오타와 불일치를 줄인다.
- 기존 설치된 Agent, Docker label, HAProxy managed block과의 호환성을 깨지 않는다.
- 위험한 shell interpolation 지점을 명확히 통제한다.
- Electron, renderer, Agent, relay가 공유해야 하는 기본값은 이름과 책임을 맞춘다.

## 현재 현상 또는 요구사항

현재 Electron 쪽에는 SSH로 원격 Linux 서버에 실행할 command가 TypeScript 문자열 배열 또는 template literal로 직접 작성되어 있다.

주요 위치:

- `apps/desktop/electron/ssh/bootstrapScripts.ts`
  - Agent 설치/삭제 shell command
  - `/opt/remote-game-agent`
  - `/etc/systemd/system/remote-game-agent.service`
  - `AGENT_ADDR=0.0.0.0:18080`
  - `ufw`, `firewall-cmd`, `systemctl`, `curl`, `wget`
- `apps/desktop/electron/ssh/haproxyScripts.ts`
  - HAProxy 설치/적용/삭제 shell command
  - `/etc/haproxy/haproxy.cfg`
  - managed block marker
  - `apt-get`, `dnf`, `yum`, `pacman`, `zypper`, `apk`
  - HAProxy TCP frontend/backend template
  - 방화벽 open/close command
- `apps/desktop/electron/services/firewallService.ts`
  - 일반 방화벽 open/close shell script
  - `ufw`, `firewall-cmd`, `iptables`
  - close mode별 command 조합
- `apps/desktop/electron/ssh/detection.ts`
  - OS/Docker/Agent 포트 감지 command
  - Windows PowerShell, macOS shell, Linux shell command가 한 함수에 섞임
- `apps/desktop/electron/services/*Service.ts`
  - `AGENT_INSTALLED=true`, `HAPROXY_APPLIED=true`, `FIREWALL_OK` 같은 출력 sentinel 파싱

추가 검사 결과 Electron 외에도 다음 영역에 제품 기본값과 하드코딩 후보가 있다.

### Desktop renderer

- `apps/desktop/src/pages/ServerManagementPage.tsx`
  - 볼륨 루트: `/remote-game-server/volume`
  - 기본 게임 템플릿: `minecraft-java`
  - 기본 Minecraft 포트: `25565`
  - Agent 포트 안내 문구: `18080`
  - snap Docker 경로 계산: `/home/{sshUser}/remote-game-server/volume`
  - loopback host 판별: `localhost`, `127.0.0.1`, `::1`
- `apps/desktop/src/services/serverRegistrationModel.ts`
  - Agent 기본 포트: `18080`
  - Agent 기본 URL: `http://127.0.0.1:{port}`
  - Agent 다운로드 URL
  - HAProxy Agent proxy port 기본값
- `apps/desktop/src/services/agentClient.ts`
  - Agent 기본 URL
  - 기대 Agent 버전
  - Docker Minecraft API endpoint
- `apps/desktop/src/data/serverManagement.ts`
  - 샘플 서버, 샘플 Agent URL, Minecraft 템플릿, 기본 이미지, 기본 포트

### Agent service

- `services/agent/internal/docker/cli_adapter.go`
  - Docker label prefix: `remote-game-server.*`
  - 관리 컨테이너 필터: `remote-game-server.managed=true`
  - 볼륨 루트: `/remote-game-server/volume`
  - Docker 내부 mount target: `/data`
  - Minecraft template id와 target type
- `services/agent/internal/docker/factory.go`
  - 환경변수 이름: `AGENT_DOCKER_MODE`, `AGENT_DOCKER_PATH`, `AGENT_STATE_FILE`
  - 기본 state file path
- `services/agent/cmd/agent/main.go`
  - 환경변수 이름: `AGENT_TOKEN`, `AGENT_ADDR`
  - 기본 bind address: `127.0.0.1:18080`
- `services/agent/internal/frp/config.go`
  - FRP local IP 기본값

### Relay service

- `services/relay/cmd/relay/main.go`
  - relay port allocator 범위: `31000-31999`
  - 기본 listen address: `:8080`
  - 개발용 CORS origin

### 현재 사용하지 않는 renderer 후보

다음 파일은 현재 navigation에서 직접 사용되지 않는 것으로 보인다.

- `apps/desktop/src/pages/ConsolePage.tsx`
- `apps/desktop/src/pages/PublishSettingsPage.tsx`
- `apps/desktop/src/data/publishSettings.ts`
- `apps/desktop/src/services/publishWorkflow.ts`
- `apps/desktop/src/services/relayClient.ts`

이 파일들은 삭제 여부를 바로 결정하지 않고, 현재 기능에서 죽은 코드인지 또는 재사용 예정 코드인지 먼저 확인해야 한다.

## 재현 방법 또는 확인 방법

다음 명령으로 하드코딩된 command 후보를 확인할 수 있다.

```powershell
Get-ChildItem -Path apps/desktop/electron -Recurse -File -Include *.ts |
  Select-String -Pattern 'systemctl|ufw|firewall-cmd|iptables|haproxy|AGENT_|/opt/|/etc/|0\.0\.0\.0|18080|apt-get|dnf|yum|pacman|zypper|apk'
```

Electron 외 프로젝트는 빌드 산출물과 문서 폴더를 제외하고 다음 기준으로 확인했다.

```powershell
$patterns = 'remote-game-server|18080|25565|31000|31999|127\.0\.0\.1|localhost|/opt/|/etc/|/home/|/remote-game-server|minecraft-java|AGENT_|HAPROXY_|FIREWALL_|ListenAndServe|CORS|label='
Get-ChildItem -Path . -Recurse -File -Include *.ts,*.tsx,*.go |
  Where-Object {
    $rel = $_.FullName.Substring((Get-Location).Path.Length + 1)
    ($rel -notmatch '^(apps[\\/]desktop[\\/]electron|docs)[\\/]') -and
    ($rel -notmatch '(^|[\\/])(node_modules|dist|dist-electron|\.git)([\\/]|$)')
  } |
  Select-String -Pattern $patterns -CaseSensitive:$false
```

현재 특히 큰 파일은 다음과 같다.

- `apps/desktop/electron/ssh/haproxyScripts.ts`: 약 12KB
- `apps/desktop/electron/ssh/detection.ts`: 약 6KB
- `apps/desktop/electron/services/firewallService.ts`: 약 4.8KB
- `apps/desktop/electron/ssh/bootstrapScripts.ts`: 약 4.8KB

## 원인 가설

초기 MVP 단계에서 실제 서버 검증과 트러블슈팅 속도를 우선하면서 command를 가까운 위치에 직접 작성했다.

그 결과 다음 문제가 생겼다.

- 동일한 도구 감지 패턴이 여러 파일에 반복된다.
- Agent port, Agent path, service name 같은 제품 기본값이 여러 위치에 흩어져 있다.
- sentinel 문자열과 parser가 분리되어 오타를 타입으로 막기 어렵다.
- shell script가 TypeScript 문자열 안에 길게 들어가 테스트하기 어렵다.
- HAProxy, firewall, Agent 설치 책임이 파일 단위로 명확히 나뉘지 않는다.

## 영향 범위

### 포함 범위

- Electron main process 쪽 command 생성 코드
- SSH command 실행 전후 파싱 코드
- Agent bootstrap command
- HAProxy command
- firewall command
- OS/Docker/Agent detection command
- 관련 단위 테스트 또는 최소 command snapshot 테스트
- Desktop renderer의 Agent URL, Agent version, 게임 템플릿, 볼륨 루트 기본값
- Agent service의 Docker label, volume path, mount target, env key, bind address 기본값
- Relay service의 listen address, port allocation range, CORS 기본값

### 제외 범위

- Renderer UI 구조 변경
- Agent Go API 변경
- Docker label key 변경
- 기존 볼륨 경로 실제 마이그레이션
- 이미 설치된 서버의 Agent service 이름 변경
- HAProxy 기존 managed block marker 즉시 변경
- README, README_kor 같은 문서 예시 값의 의미 변경
- 사용하지 않는 renderer 후보 파일 삭제

Docker label, 기존 Agent path, 기존 HAProxy marker는 호환성 문제를 만들 수 있으므로 “상수화”는 하되 기본값 자체를 바꾸지는 않는다.

추가 검사에서 발견된 `remote-game-server.*` label과 `/remote-game-server/volume`은 기존 컨테이너 조회, 삭제, 볼륨 탐색과 직접 연결된다. OpenServerHub 명칭에 맞춰 값을 바꾸는 작업은 별도 마이그레이션 계획 없이는 진행하지 않는다.

## 분류 기준

### 1. 설정으로 분리할 값

바뀔 가능성이 있고 제품 정책에 가까운 값이다.

- Agent 기본 포트: `18080`
- Agent bind address 기본값: `0.0.0.0`
- Agent 설치 경로: `/opt/remote-game-agent`
- Agent systemd service name: `remote-game-agent`
- Agent state file path
- HAProxy config path: `/etc/haproxy/haproxy.cfg`
- HAProxy backup suffix
- HAProxy managed marker prefix
- GitHub release Agent download URL
- command temporary file prefix
- Agent 기대 버전
- 게임 템플릿 기본값
- relay listen address
- relay port allocation range
- 개발용 CORS origin

후보 파일:

- `apps/desktop/electron/config/runtimeDefaults.ts`
- `apps/desktop/electron/config/remotePaths.ts`
- 또는 `apps/desktop/electron/config/openServerHubDefaults.ts`
- `apps/desktop/src/config/openServerHubDefaults.ts`
- `services/agent/internal/config/defaults.go`
- `services/relay/internal/config/defaults.go`

### 2. 내부 프로토콜 상수로 분리할 값

사용자 설정값은 아니지만 코드 전체에서 동일해야 하는 값이다.

- `AGENT_INSTALLED=true`
- `AGENT_STARTED=true`
- `AGENT_FIREWALL_OPENED=true`
- `HAPROXY_INSTALLED=true`
- `HAPROXY_APPLIED=true`
- `FIREWALL_OK`
- `__OS_START__`, `__DOCKER_START__`, `__AGENT_START__`
- Docker label key: `remote-game-server.managed`, `remote-game-server.instanceId`, `remote-game-server.templateId`
- Agent env key: `AGENT_TOKEN`, `AGENT_ADDR`
- Agent API route 조각

후보 파일:

- `apps/desktop/electron/commands/sentinels.ts`
- `apps/desktop/electron/commands/outputParsers.ts`
- `services/agent/internal/docker/labels.go`
- `services/agent/internal/config/env.go`

### 3. command fragment로 분리할 값

shell command 자체는 코드에 남을 수밖에 없지만, 재사용 가능한 fragment로 쪼갠다.

- sudo prefix 결정
- command availability check: `command -v ...`
- firewall tool detection
- ufw allow/delete/deny
- firewalld add/remove/rich-rule
- iptables add/remove/drop
- systemd service write/reload/start/stop
- curl/wget download
- port listening detection
- OS release detection

후보 파일:

- `apps/desktop/electron/commands/shellQuote.ts`
- `apps/desktop/electron/commands/shellFragments.ts`
- `apps/desktop/electron/commands/firewallFragments.ts`
- `apps/desktop/electron/commands/systemdFragments.ts`
- `apps/desktop/electron/commands/downloadFragments.ts`

### 4. script builder로 유지할 영역

복잡한 command는 무리하게 외부 `.sh` 파일로 빼기보다 TypeScript builder로 유지한다.

이유:

- Electron 패키징 후 외부 script 파일 경로 처리와 권한 문제가 생길 수 있다.
- SSH로 전달할 때 변수 주입과 quoting을 TypeScript에서 검증해야 한다.
- 사용자 입력값을 shell에 넣기 전에 sanitize/quote하는 책임이 builder에 있어야 한다.

대신 builder의 입력/출력을 테스트 가능하게 만든다.

후보 파일:

- `apps/desktop/electron/commands/agentBootstrapCommand.ts`
- `apps/desktop/electron/commands/haproxyCommand.ts`
- `apps/desktop/electron/commands/firewallCommand.ts`
- `apps/desktop/electron/commands/detectionCommand.ts`

## 단계별 작업 개요

### 1단계: command default/config와 sentinel 분리

변경 방향:

- Agent/HAProxy/firewall 기본값을 상수 파일로 분리한다.
- sentinel 문자열을 한 곳에 모은다.
- service parser가 sentinel 상수를 참조하도록 변경한다.

예상 파일:

- 추가: `apps/desktop/electron/config/remoteDefaults.ts`
- 추가: `apps/desktop/electron/commands/sentinels.ts`
- 수정: `agentBootstrapService.ts`
- 수정: `haproxyService.ts`
- 수정: `firewallService.ts`
- 수정: `bootstrapScripts.ts`
- 수정: `haproxyScripts.ts`
- 수정: `detection.ts`

검증:

- `npm run desktop:typecheck`
- `npm run desktop:build`

### 2단계: 공통 shell utility와 firewall fragment 분리

변경 방향:

- `shellSingleQuote`, `shellQuote`를 공통 utility로 합친다.
- firewall open/close command를 `firewallFragments.ts`로 분리한다.
- `firewallService.ts`와 `haproxyScripts.ts`가 같은 fragment를 사용하도록 정리한다.

예상 파일:

- 추가: `apps/desktop/electron/commands/shellQuote.ts`
- 추가: `apps/desktop/electron/commands/firewallFragments.ts`
- 수정: `firewallService.ts`
- 수정: `haproxyScripts.ts`

검증:

- firewall open/close command 문자열 snapshot 또는 단위 테스트
- `npm run desktop:typecheck`
- `npm run desktop:build`

### 3단계: Agent bootstrap script builder 분리

변경 방향:

- Agent env file content builder 분리
- systemd service content builder 분리
- install/remove script builder 분리
- Agent port/path/service name은 config에서만 참조

예상 파일:

- 추가: `apps/desktop/electron/commands/agentBootstrapCommand.ts`
- 추가: `apps/desktop/electron/commands/systemdFragments.ts`
- 수정 또는 축소: `apps/desktop/electron/ssh/bootstrapScripts.ts`

검증:

- Agent install command에 기존 sentinel 포함 여부 확인
- Agent remove command에 firewall close option 반영 여부 확인
- `npm run desktop:typecheck`
- `npm run desktop:build`

### 4단계: HAProxy script builder 분리

변경 방향:

- HAProxy config block renderer 분리
- HAProxy install command 분리
- HAProxy apply/remove command 분리
- managed block cleanup awk는 별도 builder 함수로 분리
- package manager install matrix를 데이터 구조로 표현

예상 파일:

- 추가: `apps/desktop/electron/commands/haproxyConfigRenderer.ts`
- 추가: `apps/desktop/electron/commands/haproxyInstallCommand.ts`
- 추가: `apps/desktop/electron/commands/haproxyRouteCommand.ts`
- 수정 또는 축소: `apps/desktop/electron/ssh/haproxyScripts.ts`

검증:

- HAProxy TCP route block snapshot
- route id sanitize 결과 확인
- apply/remove command에 기존 marker 호환성 유지 확인
- `npm run desktop:typecheck`
- `npm run desktop:build`

### 5단계: detection command 분리

변경 방향:

- Windows/macOS/Linux detection command를 OS별 builder로 분리한다.
- section marker를 sentinel 상수로 참조한다.
- Docker status parser와 Agent port parser는 현재 behavior를 유지한다.

예상 파일:

- 추가: `apps/desktop/electron/commands/detectionCommand.ts`
- 수정 또는 축소: `apps/desktop/electron/ssh/detection.ts`

검증:

- OS별 command 생성 테스트
- `extractSection` 테스트
- Docker issue parser 테스트
- `npm run desktop:typecheck`
- `npm run desktop:build`

### 6단계: Electron 외 renderer/Agent/relay 기본값 정리

변경 방향:

- Desktop renderer의 Agent URL, Agent version, 게임 템플릿, 볼륨 루트 기본값을 config/data 경계로 분리한다.
- Agent Go service의 Docker label key, volume root, mount target, env key, default address를 상수 파일로 분리한다.
- Relay service의 listen address, port allocation range, CORS origin을 config로 분리한다.
- 테스트 fixture는 production 상수를 가져오거나, 의도적으로 snapshot fixture로 남길지 파일별로 결정한다.

예상 파일:

- 추가: `apps/desktop/src/config/openServerHubDefaults.ts`
- 수정: `apps/desktop/src/pages/ServerManagementPage.tsx`
- 수정: `apps/desktop/src/services/serverRegistrationModel.ts`
- 수정: `apps/desktop/src/services/agentClient.ts`
- 수정: `apps/desktop/src/data/serverManagement.ts`
- 추가: `services/agent/internal/docker/labels.go`
- 추가: `services/agent/internal/config/defaults.go`
- 수정: `services/agent/internal/docker/cli_adapter.go`
- 수정: `services/agent/internal/docker/factory.go`
- 수정: `services/agent/cmd/agent/main.go`
- 추가: `services/relay/internal/config/defaults.go`
- 수정: `services/relay/cmd/relay/main.go`

검증:

- `npm run desktop:typecheck`
- `npm run desktop:build`
- `go test ./...` in `services/agent`
- `go test ./...` in `services/relay`

주의:

- Go service와 Electron/renderer 사이의 상수를 물리적으로 공유하려면 별도 generated config 또는 shared schema가 필요하다.
- 이번 단계에서는 우선 각 프로젝트 안에서 책임 있는 상수 파일을 만들고, cross-language 공유는 후속 검토로 남기는 편이 안전하다.

## 권장 디렉터리 구조

```text
apps/desktop/electron/
  commands/
    shellQuote.ts
    sentinels.ts
    outputParsers.ts
    firewallFragments.ts
    systemdFragments.ts
    downloadFragments.ts
    agentBootstrapCommand.ts
    haproxyConfigRenderer.ts
    haproxyInstallCommand.ts
    haproxyRouteCommand.ts
    detectionCommand.ts
  config/
    remoteDefaults.ts
apps/desktop/src/
  config/
    openServerHubDefaults.ts
services/agent/internal/
  config/
    defaults.go
    env.go
  docker/
    labels.go
services/relay/internal/
  config/
    defaults.go
```

기존 `ssh/*Scripts.ts`는 바로 삭제하지 않고 1차로 facade 역할만 하게 줄이는 방식을 권장한다.

예:

```text
ssh/bootstrapScripts.ts -> commands/agentBootstrapCommand.ts 재export
ssh/haproxyScripts.ts   -> commands/haproxy* 재export
```

이렇게 하면 import 경로 변경 범위가 줄어들고, 검수 중 문제가 생겼을 때 되돌리기 쉽다.

## 테스트 계획

필수:

```bash
npm run desktop:typecheck
npm run desktop:build
```

권장 추가:

```bash
npm run test -w apps/desktop
```

현재 desktop에 테스트 러너가 없으면 다음 중 하나를 선택한다.

- Node 내장 `node:test`로 command builder 단위 테스트 추가
- Vitest 추가는 별도 승인 후 진행
- 우선 TypeScript 기반 lightweight assertion script를 `scripts/`에 추가

테스트 대상:

- shell quote 함수
- firewall open/close fragment
- Agent env/service content
- HAProxy TCP route block
- HAProxy remove command가 route id filter를 포함하는지
- sentinel parser
- OS/Docker/Agent section parser
- Docker label key와 container filter
- Agent 기본 state file path
- renderer 기본 Agent URL 계산
- relay port allocator 기본 범위

## 위험 요소

- 기존 Agent 설치 경로 또는 service name을 바꾸면 원격 서버 삭제/업데이트가 깨질 수 있다.
- HAProxy managed marker를 바꾸면 기존 `/etc/haproxy/haproxy.cfg`의 관리 블록 정리가 안 될 수 있다.
- Docker label prefix를 바꾸면 기존 컨테이너 목록 조회가 깨질 수 있다.
- shell script를 너무 잘게 쪼개면 실제 실행 순서를 파악하기 어려워질 수 있다.
- 외부 `.sh` 파일 방식으로 바꾸면 Electron 패키징과 script 권한 문제가 생길 수 있다.
- renderer와 Agent service의 기본값을 각각 따로 고치면 UI 표시와 실제 Agent 동작이 엇갈릴 수 있다.
- 테스트 fixture에 production 상수를 너무 많이 끌어오면 regression test가 느슨해질 수 있다.

따라서 이번 작업은 값과 책임을 분리하되, 원격 서버에 적용되는 실제 command behavior는 유지하는 방향으로 진행한다.

## 검토 포인트

작업지시자 검토가 필요한 결정:

1. Agent 기본 bind address를 계속 `0.0.0.0:18080`로 둘지, `127.0.0.1:18080`로 바꾸는 별도 보안 작업을 잡을지
2. `/opt/remote-game-agent` 기본 경로를 OpenServerHub 이름에 맞춰 새 경로로 바꿀지, 기존 호환성을 위해 유지할지
3. HAProxy managed marker `remote-game-server`를 유지할지, 신규 설치부터 `open-server-hub` marker를 병행할지
4. 테스트 러너를 추가할지, 우선 build/typecheck와 lightweight script로 갈지
5. command builder를 Electron 내부 코드로 둘지, 나중에 Agent/CLI와 공유 가능한 별도 패키지로 분리할지
6. `/remote-game-server/volume`과 Docker label은 호환성을 위해 유지하고 UI 명칭만 OpenServerHub로 갈지
7. 현재 navigation에서 빠진 Console/Publish 관련 renderer 파일을 유지, 삭제, archive 중 어느 방향으로 처리할지
8. relay 기본값을 현재 코드에 남길지, 별도 config 파일과 환경변수로 열어둘지

## 승인 요청

이 계획은 아직 구현을 포함하지 않는다.

승인되면 다음 단계에서 `docs/plans/task_4_impl.md` 구현계획서를 작성하고, 작업지시자의 추가 승인 후 코드 변경을 시작한다.
