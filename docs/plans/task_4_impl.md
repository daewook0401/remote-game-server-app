# task_4 Electron SSH command 하드코딩 정리 구현계획서

## 분석 결과

`apps/desktop/electron`의 SSH command 생성 코드는 실제 원격 서버에 실행되는 shell script를 TypeScript 문자열로 조합하고 있다.

현재 구조의 핵심 문제는 command 자체가 존재한다는 점이 아니라, 다음 값과 책임이 같은 파일 안에 섞여 있다는 점이다.

- 제품 기본값: Agent port, Agent path, service name, HAProxy config path
- 원격 실행 절차: install, update, remove, firewall open/close, detection
- shell fragment: sudo, command 존재 확인, package manager별 install, systemd, download, firewall tool
- 출력 프로토콜: `AGENT_INSTALLED=true`, `HAPROXY_APPLIED=true`, `FIREWALL_OK`
- 파서: stdout에서 sentinel을 찾아 UI 결과로 변환하는 로직

이번 구현은 1단계부터 5단계까지 Electron main process command 정리를 우선 처리한다.

Renderer, Go Agent, relay에서 발견된 추가 하드코딩은 `task_4.md`에 기록했지만, 이번 구현계획서의 직접 변경 범위에는 넣지 않는다. Electron 쪽 정리가 끝난 뒤 같은 기준으로 6단계 구현계획서를 별도로 작성하는 것이 안전하다.

## 확정 설계 방향

이번 작업의 원칙은 behavior 유지형 리팩터링이다.

- 기존 원격 서버와의 호환성을 우선한다.
- `remote-game-server` marker, 기존 Agent service name, 기존 Agent install path는 기본값을 바꾸지 않는다.
- shell script를 외부 `.sh` 파일로 빼지 않고 TypeScript builder로 유지한다.
- 긴 template literal은 목적별 builder와 fragment로 나눈다.
- 사용자 입력 또는 서버 입력이 shell에 들어가는 위치는 quote/sanitize utility를 거치게 한다.
- sentinel 문자열은 parser와 같은 상수 모듈에서 참조한다.
- 기존 `ssh/*Scripts.ts` 파일은 바로 삭제하지 않고 facade 또는 얇은 wrapper로 축소한다.

## 수정 예정 파일

### 신규 파일

- `apps/desktop/electron/config/remoteDefaults.ts`
- `apps/desktop/electron/commands/sentinels.ts`
- `apps/desktop/electron/commands/shellQuote.ts`
- `apps/desktop/electron/commands/shellFragments.ts`
- `apps/desktop/electron/commands/firewallFragments.ts`
- `apps/desktop/electron/commands/systemdFragments.ts`
- `apps/desktop/electron/commands/downloadFragments.ts`
- `apps/desktop/electron/commands/agentBootstrapCommand.ts`
- `apps/desktop/electron/commands/haproxyConfigRenderer.ts`
- `apps/desktop/electron/commands/haproxyInstallCommand.ts`
- `apps/desktop/electron/commands/haproxyRouteCommand.ts`
- `apps/desktop/electron/commands/detectionCommand.ts`

### 수정 파일

- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/electron/ssh/haproxyScripts.ts`
- `apps/desktop/electron/ssh/detection.ts`
- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/services/haproxyService.ts`
- `apps/desktop/electron/services/firewallService.ts`
- 필요 시 `apps/desktop/electron/types.ts`

## 단계별 구현 계획

### 1단계: default/config와 sentinel 분리

목표:

- 제품 기본값과 출력 sentinel을 한 곳에서 관리한다.
- 아직 command 구조를 크게 바꾸지 않고 import만 점진적으로 교체한다.

변경 파일:

- 추가: `apps/desktop/electron/config/remoteDefaults.ts`
- 추가: `apps/desktop/electron/commands/sentinels.ts`
- 수정: `apps/desktop/electron/ssh/bootstrapScripts.ts`
- 수정: `apps/desktop/electron/ssh/haproxyScripts.ts`
- 수정: `apps/desktop/electron/ssh/detection.ts`
- 수정: `apps/desktop/electron/services/agentBootstrapService.ts`
- 수정: `apps/desktop/electron/services/haproxyService.ts`
- 수정: `apps/desktop/electron/services/firewallService.ts`

구현 내용:

- `remoteDefaults.ts`에 다음 기본값을 정의한다.
  - Agent install dir
  - Agent service name
  - Agent default bind host
  - Agent default port
  - Agent env file path
  - systemd service path
  - HAProxy config path
  - HAProxy backup path suffix
  - HAProxy managed marker prefix
  - remote command temp prefix
- `sentinels.ts`에 다음 그룹을 정의한다.
  - Agent bootstrap sentinel
  - HAProxy sentinel
  - firewall sentinel
  - detection section marker
- 기존 파일의 literal 문자열을 상수 import로 교체한다.
- parser는 같은 문자열을 직접 비교하지 않고 sentinel 상수를 참조하게 한다.

검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

중간 보고:

- `docs/working/task_4_stage_1.md`

승인 기준:

- 빌드 결과가 기존과 동일하게 통과한다.
- 원격 실행 command의 실제 출력 sentinel 값이 바뀌지 않는다.

### 2단계: 공통 shell utility와 firewall fragment 분리

목표:

- 여러 파일에 중복된 quote, command check, firewall tool command를 공통 fragment로 분리한다.
- HAProxy route 적용과 일반 firewall open/close가 같은 firewall fragment를 사용하게 한다.

변경 파일:

- 추가: `apps/desktop/electron/commands/shellQuote.ts`
- 추가: `apps/desktop/electron/commands/shellFragments.ts`
- 추가: `apps/desktop/electron/commands/firewallFragments.ts`
- 수정: `apps/desktop/electron/services/firewallService.ts`
- 수정: `apps/desktop/electron/ssh/haproxyScripts.ts`

구현 내용:

- `shellQuote.ts`
  - POSIX shell single quote 함수
  - route id, frontend/backend name에 필요한 sanitize helper
- `shellFragments.ts`
  - `command -v` fragment
  - sudo prefix 결정 fragment
  - port/protocol validation helper
- `firewallFragments.ts`
  - ufw allow/delete/deny fragment
  - firewalld add/remove port fragment
  - firewalld rich-rule fragment
  - iptables accept/drop/delete fragment
  - 전체 허용과 CIDR 제한 허용을 분리
- `firewallService.ts`
  - close mode별 script 조합은 유지하되 firewall command 조각만 fragment를 사용한다.
- `haproxyScripts.ts`
  - HAProxy proxy port open/close에서 같은 firewall fragment를 사용한다.

검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

수동 확인 항목:

- 허용 IP/CIDR이 비어 있으면 전체 허용 command가 생성되는지
- 허용 IP/CIDR이 있으면 firewalld rich-rule 또는 iptables source 제한 command가 생성되는지
- close mode가 기존 UI 선택과 동일한 의미로 동작하는지

중간 보고:

- `docs/working/task_4_stage_2.md`

승인 기준:

- 기존 firewall open/close 기능의 command 순서와 의미가 유지된다.
- HAProxy 경유 서버의 proxy port 방화벽 처리 흐름이 유지된다.

### 3단계: Agent bootstrap command builder 분리

목표:

- Agent 설치, 업데이트, 삭제 command를 builder 중심으로 재구성한다.
- systemd service 내용과 env 내용 생성을 별도 함수로 분리한다.

변경 파일:

- 추가: `apps/desktop/electron/commands/systemdFragments.ts`
- 추가: `apps/desktop/electron/commands/downloadFragments.ts`
- 추가: `apps/desktop/electron/commands/agentBootstrapCommand.ts`
- 수정: `apps/desktop/electron/ssh/bootstrapScripts.ts`
- 수정: `apps/desktop/electron/services/agentBootstrapService.ts`

구현 내용:

- `systemdFragments.ts`
  - service file content builder
  - daemon-reload, enable, restart, stop, disable fragment
- `downloadFragments.ts`
  - curl/wget 감지 및 다운로드 fragment
  - 실행 권한 부여 fragment
- `agentBootstrapCommand.ts`
  - Agent env file content builder
  - prepare/install/update/remove command builder
  - firewall open/close option을 입력값으로 받는 구조
  - sentinel 출력 위치 유지
- `bootstrapScripts.ts`
  - 기존 export 이름을 유지하고 내부에서 새 builder를 호출하는 facade로 축소
- `agentBootstrapService.ts`
  - parser는 1단계 sentinel 상수를 사용
  - 기존 IPC 반환 구조는 변경하지 않음

검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

수동 확인 항목:

- Agent install command에 env file 생성, service file 생성, daemon reload, service start 순서가 유지되는지
- Agent update command가 기존 설치 경로와 service name을 그대로 사용하는지
- Agent remove command가 service stop/remove 후 firewall close option을 처리하는지
- `AGENT_ADDR` 기본값이 기존 의도와 동일하게 유지되는지

중간 보고:

- `docs/working/task_4_stage_3.md`

승인 기준:

- 기존 설치된 Agent를 업데이트/삭제하는 경로가 깨지지 않는다.
- Agent 설치 성공 판단 sentinel이 바뀌지 않는다.

### 4단계: HAProxy script builder 분리

목표:

- HAProxy 설치, route 적용, route 삭제 command를 분리한다.
- HAProxy config block renderer를 별도 함수로 빼서 중복 block 누적과 삭제 로직을 검토 가능하게 만든다.

변경 파일:

- 추가: `apps/desktop/electron/commands/haproxyConfigRenderer.ts`
- 추가: `apps/desktop/electron/commands/haproxyInstallCommand.ts`
- 추가: `apps/desktop/electron/commands/haproxyRouteCommand.ts`
- 수정: `apps/desktop/electron/ssh/haproxyScripts.ts`
- 수정: `apps/desktop/electron/services/haproxyService.ts`

구현 내용:

- `haproxyConfigRenderer.ts`
  - managed block id builder
  - frontend/backend name builder
  - Agent TCP route block renderer
  - game TCP/UDP route block renderer
  - 기존 marker prefix 호환 유지
- `haproxyInstallCommand.ts`
  - OS/package manager별 HAProxy 설치 command matrix 분리
  - 설치 감지 command와 설치 command 분리
  - 설치 실패 시 UI가 password/install confirm 흐름을 유지할 수 있게 기존 service 반환 구조 유지
- `haproxyRouteCommand.ts`
  - apply route command builder
  - remove route command builder
  - 기존 managed block cleanup 로직 분리
  - HAProxy config validate와 reload 순서 유지
  - proxy port firewall open/close를 2단계 fragment로 연결
- `haproxyScripts.ts`
  - 기존 export 이름 유지, 내부에서 새 builder 호출
- `haproxyService.ts`
  - parser는 1단계 sentinel 상수 사용

검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

수동 확인 항목:

- Agent proxy `18080` route block이 기존과 같은 bind/backend 의미를 유지하는지
- Minecraft 같은 game route block이 외부 port와 내부 target port를 올바르게 분리하는지
- route remove가 해당 route block만 제거하고 다른 managed block을 건드리지 않는지
- HAProxy reload 전 config validation이 유지되는지
- 경유 서버 방화벽 open/close command가 route apply/remove에 포함되는지

중간 보고:

- `docs/working/task_4_stage_4.md`

승인 기준:

- 기존 HAProxy managed block을 정리할 수 있는 marker 호환성이 유지된다.
- 신규 route 적용 시 같은 route가 중복 누적되지 않는 구조가 유지 또는 개선된다.

### 5단계: detection command 분리

목표:

- OS, Docker, Agent detection command를 OS별 builder와 parser 경계로 정리한다.
- detection section marker를 sentinel 상수로 통일한다.

변경 파일:

- 추가: `apps/desktop/electron/commands/detectionCommand.ts`
- 수정: `apps/desktop/electron/ssh/detection.ts`
- 수정 가능: `apps/desktop/electron/services/sshDiagnosticsService.ts`

구현 내용:

- `detectionCommand.ts`
  - Windows detection command builder
  - macOS detection command builder
  - Linux detection command builder
  - OS section, Docker section, Agent section marker builder
  - port listening detection fragment
- `detection.ts`
  - public function 이름은 유지
  - 내부 command 문자열은 OS별 builder에서 가져오게 변경
  - `extractSection`이 sentinel 상수를 참조하게 변경
- `sshDiagnosticsService.ts`
  - 필요 시 detection parser import 경로만 조정

검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

수동 확인 항목:

- Linux 서버에서 OS, Docker, Agent 상태 section이 기존 parser에 동일하게 들어오는지
- Agent port detection이 기존 안내 문구와 같은 결과를 만드는지
- Windows/macOS local detection command가 typecheck/build에서 깨지지 않는지

중간 보고:

- `docs/working/task_4_stage_5.md`

승인 기준:

- 서버 등록 전 SSH 확인과 Agent 상태 확인 흐름이 기존 UI 결과와 동일하게 동작한다.
- detection 출력 section 이름 변경으로 인한 parser 실패가 없다.

## 전체 검증 계획

각 단계마다 최소 검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

5단계 완료 후 전체 검증:

```bash
npm run desktop:typecheck
npm run desktop:build
```

가능하면 추가로 확인할 수동 시나리오:

- 서버 추가 modal에서 SSH 확인
- Agent 설치 또는 업데이트
- 외부망 HAProxy 경유 서버 등록
- Agent API 확인 후 서버 등록
- Minecraft 서버 생성 시 내부 서버 방화벽과 경유 서버 방화벽 처리 확인
- Docker 컨테이너 삭제 시 내부 서버와 경유 서버의 firewall/HAProxy route 정리 확인

## 단계별 보고 계획

구현 승인 후 실제 작업에서는 각 단계 완료마다 다음 파일을 작성한다.

- `docs/working/task_4_stage_1.md`
- `docs/working/task_4_stage_2.md`
- `docs/working/task_4_stage_3.md`
- `docs/working/task_4_stage_4.md`
- `docs/working/task_4_stage_5.md`

각 보고서에는 다음을 포함한다.

- 변경 파일
- 변경 내용
- 실행한 검증 명령
- 검증 결과
- 실패 또는 미검증 항목
- 다음 단계 진행 가능 여부

## 위험 요소

- command builder 분리 중 shell quote가 달라지면 실제 원격 command가 실패할 수 있다.
- HAProxy marker cleanup 로직이 바뀌면 기존 `/etc/haproxy/haproxy.cfg`의 managed block을 못 지울 수 있다.
- Agent install path나 service name 기본값이 실수로 바뀌면 기존 설치 서버의 update/remove가 깨질 수 있다.
- firewall fragment를 공통화하면서 경유 서버와 내부 서버의 포트 처리 책임이 섞일 수 있다.
- snapshot 테스트 없이 문자열 구조를 바꾸면 build는 통과하지만 실제 shell 동작이 달라질 수 있다.

## 보류 항목

이번 1~5단계에서는 다음 작업을 하지 않는다.

- Renderer UI 구조 변경
- Go Agent 기본값 상수화
- Relay 기본값 상수화
- Docker label prefix 변경
- `/remote-game-server/volume` 경로 변경
- 사용하지 않는 renderer 후보 파일 삭제
- 외부 `.sh` 파일 도입
- 테스트 러너 신규 도입

위 항목은 1~5단계 완료 후 별도 계획으로 분리한다.

## 승인 요청

이 구현계획서는 1단계부터 5단계까지 Electron command 정리 작업의 순서와 범위를 확정하기 위한 문서다.

승인되면 1단계부터 순서대로 진행하고, 각 단계마다 중간 보고서를 작성한 뒤 다음 단계 진행 여부를 보고한다.
