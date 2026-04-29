# task_3 구현계획서

## 분석 결과

- 현재 서버 등록은 `ServerRegistrationPanel`에서 SSH 정보와 Agent 정보를 한 번에 입력하고, `ServerManagementPage`의 `handleRegisterServer`가 즉시 `ManagedServer`를 생성한다.
- 현재 원격 Agent 설치는 `prepareRemoteAgent`가 단일 대상 서버 SSH 정보만 받아 실행한다.
- 현재 Agent API 요청은 `ManagedServer.agentBaseUrl`을 그대로 사용한다.
- 현재 버튼 스타일은 전역 `button:disabled`만 있고, hover/active/loading 상태가 충분하지 않다.
- 현재 긴 요청은 `pendingFirewallOpen`, `pendingAction`, `pendingCreate`처럼 일부만 상태가 있고, SSH 확인/Agent 설치/서버 등록/서버 삭제에는 일관된 pending 상태가 없다.
- 점프 서버 경유와 SSH 터널은 네트워크 모델, Electron SSH 클라이언트, Agent API URL 해석 방식까지 영향을 주므로 단계 분리가 필요하다.

## 확정한 원인 또는 설계 방향

- 서버 대상 유형(`local`, `remote`, `cloud`)과 네트워크 접속 경로(`directSsh`, `jumpSsh`, `directPublic`)를 분리한다.
- 서버 등록은 `SSH 확인 -> Agent 설치 및 Agent 포트 설정 -> Agent API 확인 -> 서버 등록` 순서로만 진행되게 한다.
- 등록 화면에서는 각 단계의 완료 상태를 저장하고, 핵심 입력값이 바뀌면 이후 단계 상태를 무효화한다.
- 점프 서버 경유는 Desktop에서 Jump Server로 SSH 연결한 뒤 Target Server로 접근하는 구조로 설계한다.
- Agent API는 저장된 실제 대상 정보와 런타임 접근 URL을 분리한다. 장기적으로는 `agentBaseUrl`은 실제 대상/표시용, `resolvedAgentUrl`은 요청용으로 사용한다.
- `18080` Agent 포트는 SSH 터널 경로에서 외부 공개하지 않는 것을 기본으로 한다.
- 클릭 가능한 버튼은 hover/cursor/active 상태를 전역 스타일로 정리하고, 긴 요청 버튼에는 pending 상태와 로딩 문구를 붙인다.
- 점프 서버 경유에서 포트 설정 명령은 점프 서버가 아니라 Target Server에서 실행한다.
- 등록 완료된 서버 상세 화면에서는 `Agent 설치` 버튼을 제거하고, Agent 재설치는 `Agent 업데이트` 흐름으로 처리한다.

## 수정 예정 파일

- `apps/desktop/src/types/server.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/electron/ssh/sshClient.ts`
- `apps/desktop/electron/services/sshDiagnosticsService.ts`
- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/vite-env.d.ts`
- `apps/desktop/src/services/agentBootstrapClient.ts`
- `apps/desktop/src/services/sshClient.ts`
- `apps/desktop/src/services/agentClient.ts`
- `docs/working/task_3_stage_1.md`
- `docs/working/task_3_stage_2.md`
- `docs/working/task_3_stage_3.md`
- `docs/report/task_3_report.md`
- `docs/orders/20260429.md`

## 파일별 변경 계획

- `types/server.ts`
  - `ServerConnectionMode = "directSsh" | "jumpSsh" | "directPublic"` 타입을 추가한다.
  - 점프 서버 SSH 정보 타입을 추가한다.
  - `ManagedServer`와 `ServerRegistrationForm`에 `connectionMode`, `jumpHost`, `jumpPort`, `jumpUser`, `jumpAuthMethod`, `jumpKeyPath` 등을 추가한다.
  - 서버 등록 단계 상태 타입을 추가한다.
- `electron/types.ts`
  - renderer 타입과 동일하게 접속 경로와 점프 서버 SSH 정보를 추가한다.
  - SSH 테스트, Agent 설치, Agent 삭제 요청이 점프 서버 정보를 받을 수 있게 확장한다.
- `ServerRegistrationPanel.tsx`
  - 접속 경로 선택 컨트롤을 추가한다.
  - `점프 서버 경유` 선택 시 점프 서버 SSH 입력 영역을 표시한다.
  - 등록 플로우 상태를 보여주는 간단한 단계 표시를 추가한다.
  - `SSH 확인`, `Agent 설치`, `서버 등록` 버튼의 disabled/loading 문구를 props로 받는다.
  - `Agent 포트 설정`은 독립 버튼이 아니라 Agent 설치 단계에 포함되는 방향으로 정리한다.
- `ServerManagementPage.tsx`
  - 등록 단계 상태를 관리한다.
  - SSH 확인 성공 전 Agent 설치를 막는다.
  - Agent 설치 성공과 Agent API 확인 성공 전 서버 등록을 막는다.
  - 등록 관련 핵심 입력이 바뀌면 단계 상태를 무효화한다.
  - 긴 요청별 pending 상태를 추가한다.
  - 서버 상세의 `Agent 설치` 버튼을 제거하고 `Agent 업데이트`만 유지한다.
  - 서버 상세의 Agent 요청 URL을 런타임 해석 URL로 바꿀 준비를 한다.
- `styles.css`
  - `button:not(:disabled)`에 pointer cursor와 hover/active 상태를 추가한다.
  - `.loadingButton`, `.buttonSpinner` 또는 동일 역할 클래스를 추가한다.
  - disabled 버튼 상태를 더 명확히 보이게 한다.
- `sshClient.ts`
  - 점프 서버 경유 SSH 명령 실행을 위한 함수 또는 옵션을 추가한다.
  - 우선 구현은 명령 실행 경로를 지원하고, 장기 터널은 별도 함수로 분리한다.
- `sshDiagnosticsService.ts`, `agentBootstrapService.ts`
  - SSH 확인, Agent 설치, Agent 포트 설정, Agent 삭제 요청이 `connectionMode`와 jump 정보를 사용하게 한다.
  - 점프 서버 경유 시 포트 설정 명령은 Jump Server에서 한 번 더 Target Server로 들어가 실행되게 한다.
- `registerIpc.ts`, `preload.ts`, `vite-env.d.ts`, renderer 서비스 파일
  - 확장된 요청 타입과 터널 준비/해제 IPC를 반영한다.
- `agentClient.ts`
  - 기존 함수는 base URL을 이미 인자로 받으므로, 호출부에서 resolved URL을 넘기는 방향을 우선한다.

## 단계 분할

1. 등록 플로우와 버튼 UX 안정화
   - 서버 등록 단계 상태를 추가한다.
   - SSH 확인 전 Agent 설치 차단, Agent 확인 전 서버 등록 차단을 구현한다.
   - `Agent 설치` 단계에서 Agent 설치와 Agent 포트 설정을 묶는다.
   - 직접 SSH에서는 대상 서버에 바로 포트 설정을 적용하고, 점프 서버 경유에서는 내부망 대상 서버에 포트 설정을 적용하는 기준을 명시한다.
   - 버튼 hover/cursor/disabled/loading 스타일과 pending 상태를 추가한다.
   - 등록된 서버 상세 화면의 `Agent 설치` 버튼을 제거한다.
   - 검증: `npm run desktop:typecheck`, `npm run desktop:build`
   - 보고서: `docs/working/task_3_stage_1.md`
2. 접속 경로 모델과 점프 서버 등록 UI 추가
   - `connectionMode`와 점프 서버 SSH 정보를 타입/폼/저장 모델에 추가한다.
   - 서버 등록 UI에 `직접 SSH 연결`, `점프 서버 경유`, `직접 공개 예외`를 추가한다.
   - 입력 변경 시 단계 상태 무효화를 연결한다.
   - 검증: `npm run desktop:typecheck`, `npm run desktop:build`
   - 보고서: `docs/working/task_3_stage_2.md`
3. 점프 서버 경유 SSH 명령 및 Agent 경로 연결
   - SSH 확인, Agent 설치, Agent 포트 설정, Agent 삭제가 점프 서버 경유 요청을 받을 수 있게 한다.
   - 점프 서버 경유 포트 설정은 Desktop -> Jump Server -> Target Server에서 실행되게 한다.
   - SSH 터널 기반 Agent 접근을 위한 `resolvedAgentUrl` 흐름을 붙인다.
   - 서버 상세 진입 시 터널 준비 후 자동 Agent 확인 흐름을 연결한다.
   - 검증: `npm run desktop:typecheck`, `npm run desktop:build`
   - 수동 테스트: 사용자 환경에서 점프 서버 경유 접속 확인
   - 보고서: `docs/working/task_3_stage_3.md`
4. 최종 문서화
   - 최종 보고서 작성
   - 오늘 할 일 상태 갱신
   - 수동 테스트 필요 항목 정리

## 테스트 계획

- 자동 검증:
  - `npm run desktop:typecheck`
  - `npm run desktop:build`
- 수동 검증:
  - 버튼 hover 시 pointer 커서와 시각 반응 확인
  - 긴 요청 중 버튼 로딩/disabled 상태 확인
  - 요청 중 중복 클릭 방지 확인
  - SSH 확인 전 Agent 설치 차단 확인
  - Agent 확인 전 서버 등록 차단 확인
  - Agent 설치 후 Agent API 확인 성공 시 서버 등록 가능 확인
  - 등록된 서버 상세 화면에는 `Agent 설치` 버튼이 없고 `Agent 업데이트`만 남는지 확인
  - 점프 서버 경유로 내부망 대상 서버 SSH 확인
  - 점프 서버 경유로 Agent 설치
  - 점프 서버 경유로 내부망 대상 서버의 18080/tcp 방화벽 규칙 설정
  - 점프 서버 경유 터널로 Agent 상태 확인과 콘솔 확인
  - 서버 삭제 시 같은 접속 경로로 Agent/18080 정리

## 위험 요소

- 점프 서버 경유 SSH와 장기 SSH 터널은 환경 의존성이 높아 자동 테스트만으로 충분히 검증하기 어렵다.
- password 인증 기반 점프 서버 경유는 UX와 보안이 모두 불안정할 수 있어 SSH key 인증을 우선 권장한다.
- SSH 터널 세션 수명 관리가 미흡하면 서버 상세 이탈 후 연결이 남거나, 반대로 요청 중 터널이 닫힐 수 있다.
- 기존 저장 서버 데이터에는 `connectionMode`가 없으므로 기본값 보정이 필요하다.
- 현재 token은 로컬 저장소에 저장되므로 OS 보안 저장소 연동은 후속 과제로 남는다.

## 승인 요청

위 구현계획으로 진행해도 되는지 승인 요청드립니다.

승인되면 1단계인 등록 플로우 강제와 버튼 UX 안정화부터 구현하겠습니다.
## 추가 구현 계획: DNAT 포트 중계 옵션

DNAT는 `jumpSsh`의 기본 동작이 아니라 별도 포트 중계 옵션으로 설계한다.

- 1차 구현 기본값
  - Agent API는 SSH 터널 기반 `resolvedAgentUrl`을 사용한다.
  - Agent `18080`은 Target Game Server의 `127.0.0.1:18080` 또는 내부 접근 전용으로 둔다.
  - DNAT 자동 적용은 기본 구현 범위에 넣지 않고, 승인된 하위 단계로 분리한다.

- 추후 하위 단계로 추가할 항목
  - `portForwardingRules` 모델 추가
    - `sourceHost: jump`
    - `sourcePort`
    - `targetHost`
    - `targetPort`
    - `protocol`
    - `purpose: game | agent-exception`
  - 점프 서버에서 `iptables` 또는 `nftables` 기반 DNAT 규칙 생성/조회/삭제 지원
  - `net.ipv4.ip_forward=1` 상태 확인 및 필요 시 적용
  - FORWARD 체인 허용 규칙과 UFW/firewalld 충돌 여부 안내
  - 서버 삭제 시 DNAT 규칙과 관련 방화벽 규칙 정리

- Agent `18080` DNAT 예외 조건
  - 사용자가 `직접 공개 예외`를 명시적으로 선택해야 한다.
  - `AGENT_TOKEN`이 없으면 저장/적용할 수 없다.
  - 허용 IP 또는 사설망 대역 제한 없이 전체 공개하는 설정은 차단한다.
  - 삭제 플로우에서 DNAT 규칙 제거 실패 시 로컬 등록 정보 삭제를 보류하거나 사용자에게 명시 선택지를 제공한다.

검증 항목에는 `Jump Server 외부 포트 -> Target Game Server 내부 포트` 게임 트래픽 중계 확인과, Agent `18080`이 기본 경로에서는 외부로 열리지 않는지 확인을 추가한다.

## 추가 구현 계획: Agent 18080 TCP proxy 옵션

Agent `18080` 중계가 필요한 경우에는 DNAT보다 TCP proxy를 우선 구현 후보로 둔다.

- 기본 구현 원칙
  - Agent API 기본 접근은 SSH 터널이다.
  - TCP proxy는 사용자가 명시적으로 선택한 `직접 공개 예외`에서만 활성화한다.
  - TCP proxy는 점프 서버에 systemd 서비스로 등록해 앱이 상태를 추적할 수 있게 한다.
  - proxy가 Target Game Server의 `127.0.0.1:18080`에 접근하려면 점프 서버에서 Target으로 다시 SSH 터널을 만들거나, Target의 내부망 주소와 포트를 사용한다.

- 모델 후보
  - `agentAccessMode: sshTunnel | jumpSshTunnel | tcpProxy | directPublic`
  - `agentProxyHost`
  - `agentProxyListenPort`
  - `agentProxyAllowedCidrs`
  - `agentProxyTargetHost`
  - `agentProxyTargetPort`
  - `agentProxyServiceName`

- proxy 구현 후보
  - `haproxy`
  - `nginx stream`
  - `socat`
  - 별도 경량 TCP proxy systemd 서비스

MVP에서는 Agent 관리 포트와 게임 서버 포트 중계를 같은 방식으로 다룰 수 있는 `haproxy`를 우선 후보로 둔다. 단순 임시 중계만 필요하면 `socat`가 빠르지만, 허용 IP, 로그, 상태 확인, 다중 frontend/backend, 장기 운영까지 고려하면 `haproxy`가 제품 구조에 더 적합하다.

- 보안 조건
  - `AGENT_TOKEN` 없이는 TCP proxy를 생성하지 않는다.
  - 허용 IP 또는 CIDR이 비어 있으면 생성하지 않는다.
  - proxy 수신 포트는 기본 `18080` 재사용보다 별도 포트 사용을 우선 검토한다.
  - 앱에는 `SSH 터널`, `점프 터널`, `TCP proxy`, `직접 공개` 상태를 구분해 표시한다.
  - 삭제 시 proxy 서비스와 방화벽 규칙을 먼저 정리하고, 그 다음 Target Agent를 정리한다.

검증 항목에는 TCP proxy 생성, 상태 확인, Agent API 요청 성공, 허용되지 않은 IP 차단, 서버 삭제 시 proxy 서비스/방화벽 규칙 제거 확인을 추가한다.

## TCP proxy 상세 구현안

Agent `18080` TCP proxy는 다음 두 방식 중 하나로 구현한다. 기본 권장안은 A안이다.

### A안: Jump Server 내부 SSH tunnel + HAProxy TCP proxy

가장 안전한 방식이다. Target Game Server의 Agent는 계속 `127.0.0.1:18080`에만 바인딩한다.

```text
Desktop
  -> Jump Server public-ip:proxy-port
  -> HAProxy frontend
  -> HAProxy backend
  -> Jump Server 127.0.0.1:tunnel-local-port
  -> ssh -L tunnel
  -> Target Game Server 127.0.0.1:18080
```

구현 순서:

1. Desktop 앱이 Jump Server에 SSH로 접속한다.
2. Jump Server에서 Target Game Server로 SSH 접속 가능한지 확인한다.
3. Target Game Server에 Agent가 설치되어 있고 `AGENT_TOKEN`이 설정되어 있는지 확인한다.
4. Jump Server에 proxy용 로컬 터널 포트와 외부 수신 포트를 할당한다.
5. Jump Server에 `ssh -N -L 127.0.0.1:<tunnel-local-port>:127.0.0.1:18080 <target>` systemd 서비스를 생성한다.
6. Jump Server에 HAProxy frontend/backend 설정을 추가해 `<proxy-port>`를 `127.0.0.1:<tunnel-local-port>`로 중계한다.
7. Jump Server 방화벽에서 허용 IP/CIDR만 `<proxy-port>/tcp` 접근을 허용한다.
8. Desktop 앱이 `http://<jump-public-host>:<proxy-port>/healthz`와 토큰 기반 `/docker/*` API를 확인한다.
9. 성공한 경우에만 서버 등록 정보에 `agentAccessMode=tcpProxy`와 proxy 메타데이터를 저장한다.

systemd 서비스 이름 예시:

```text
remote-game-agent-proxy-{serverId}-tunnel.service
haproxy.service
```

터널 서비스 예시:

```ini
[Unit]
Description=Remote Game Agent SSH tunnel for {serverName}
After=network-online.target

[Service]
Type=simple
User={jumpUser}
ExecStart=/usr/bin/ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -L 127.0.0.1:{tunnelLocalPort}:127.0.0.1:18080 {targetUser}@{targetHost} -p {targetPort}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

HAProxy 설정 예시:

```haproxy
frontend rg_agent_{serverId}
    bind 0.0.0.0:{proxyPort}
    mode tcp
    tcp-request connection reject if !{ src {allowedCidr} }
    default_backend rg_agent_{serverId}_backend

backend rg_agent_{serverId}_backend
    mode tcp
    option tcp-check
    server target_agent 127.0.0.1:{tunnelLocalPort} check
```

방화벽 예시:

```bash
sudo ufw allow from <allowed_cidr> to any port <proxy_port> proto tcp
```

삭제 순서:

1. `remote-game-agent-proxy-{serverId}.service` 중지/비활성화/삭제
2. `remote-game-agent-proxy-{serverId}-tunnel.service` 중지/비활성화/삭제
3. `<proxy-port>/tcp` 방화벽 허용 규칙 삭제
4. 필요 시 Target Game Server Agent 서비스/데이터 삭제
5. 로컬 서버 등록 정보 삭제

HAProxy를 쓰는 경우 1번은 개별 proxy 서비스 삭제가 아니라 HAProxy 설정에서 해당 `frontend/backend` 블록 제거 후 reload로 처리한다. 터널 서비스는 서버별로 유지하므로 삭제 대상에 포함한다.

### B안: Jump Server HAProxy TCP proxy -> Target 내부 IP

Target Game Server의 Agent가 내부망 IP에서만 접근 가능하도록 열려 있는 경우에 사용할 수 있다.

```text
Desktop
  -> Jump Server public-ip:proxy-port
  -> HAProxy frontend/backend
  -> Target Game Server private-ip:18080
```

이 방식은 SSH 터널 서비스가 없어 단순하지만, Target Game Server의 Agent가 내부망 인터페이스에서 수신해야 하므로 A안보다 노출 면이 넓다. 따라서 Target 방화벽에서 Jump Server의 내부 IP만 `18080/tcp` 접근을 허용해야 한다.

### 구현 파일 영향

- `apps/desktop/electron/services/agentProxyService.ts`
  - TCP proxy 설치, 상태 확인, 삭제 명령을 담당하는 신규 서비스 후보.
- `apps/desktop/electron/ssh/bootstrapScripts.ts`
  - systemd 서비스 템플릿과 방화벽 명령 생성 함수 추가.
- `apps/desktop/electron/ipc/registerIpc.ts`, `preload.ts`, `vite-env.d.ts`
  - `agent-proxy:install`, `agent-proxy:status`, `agent-proxy:remove` IPC 추가 후보.
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
  - `Agent 접근 방식`에서 `SSH 터널`, `TCP proxy 예외` 선택 UI 추가.
- `apps/desktop/src/pages/ServerManagementPage.tsx`
  - Agent 설치 확인 후 TCP proxy 생성 단계와 proxy health check 단계 추가.

MVP에서는 A안을 우선 구현 후보로 두고, B안은 내부망 운영자가 명시적으로 선택한 경우에만 허용한다.

### HAProxy를 Agent와 게임 포트 공통 중계기로 쓰는 방안

HAProxy는 Agent `18080` 중계와 게임 서버 포트 중계를 모두 처리할 수 있다.

- Agent 중계
  - `purpose: agent`
  - 토큰 필수
  - 허용 IP/CIDR 필수
  - 가능하면 Target Agent는 `127.0.0.1:18080` 유지
  - `/healthz`와 토큰 API 확인
- 게임 서버 중계
  - `purpose: game`
  - 게임별 TCP/UDP 요구사항 확인
  - TCP 게임 포트는 HAProxy TCP frontend/backend로 처리한다.
  - UDP 게임 포트는 HAProxy UDP 지원 설치본 또는 UDP 모듈 기반 설정으로 처리한다.
  - UDP 지원 확인에 실패하면 해당 게임 포트 경유 등록을 차단한다.

따라서 TCP/UDP 경유는 모두 HAProxy 공통 중계 모델로 통일한다. DNAT, nftables, iptables 직접 중계는 기본 구현 후보에서 제외하고, HAProxy 설치가 불가능한 환경의 별도 예외 검토 대상으로만 남긴다.

### 외부망 노트북/점프 노드 HAProxy 설치 정책

HAProxy는 내부망 서버가 아니라 외부망 접근이 가능한 경유 노드에 설치한다.

```text
External Client
  -> External Network Laptop / Jump Node
  -> HAProxy
  -> Internal Network Target Game Server
```

경유 노드 요건:

- 외부 클라이언트가 접근할 수 있는 IP 또는 포트를 가진다.
- 내부망 Target Game Server의 Agent/게임 포트에 접근할 수 있다.
- HAProxy 설치와 설정 reload 권한이 있다.
- 방화벽에서 HAProxy 수신 포트를 열고, 허용 IP/CIDR 제한을 적용할 수 있다.
- UDP 포트 경유를 쓸 경우 HAProxy UDP 지원 여부를 확인할 수 있다.

등록 플로우 추가:

1. 경유 노드 SSH 확인
2. 경유 노드 HAProxy 설치 여부 확인
3. UDP 포트가 포함된 경우 HAProxy UDP 지원 여부 확인
4. 내부망 Target Game Server SSH 확인
5. Agent 설치 및 Agent 포트 설정
6. HAProxy 설정 생성
7. `haproxy -c -f <config>` 검증
8. HAProxy reload
9. Agent API 또는 게임 포트 연결 확인
10. 서버 등록

HAProxy 설정 저장 방식:

- 앱이 관리하는 설정 블록을 `/etc/haproxy/conf.d/remote-game-server-{serverId}.cfg` 같은 서버별 파일로 분리한다.
- 배포판 기본 HAProxy가 `conf.d` include를 지원하지 않으면 `/etc/haproxy/haproxy.cfg` 안에 관리 영역 마커를 두고 블록 단위로 갱신한다.
- 설정 변경 전 기존 설정을 백업한다.
- reload 전 반드시 `haproxy -c`로 설정 검증을 수행한다.

TCP Agent 예시:

```haproxy
frontend rg_agent_{serverId}
    bind 0.0.0.0:{proxyPort}
    mode tcp
    tcp-request connection reject if !{ src {allowedCidr} }
    default_backend rg_agent_{serverId}_backend

backend rg_agent_{serverId}_backend
    mode tcp
    option tcp-check
    server target_agent {targetInternalHost}:18080 check
```

TCP 게임 포트 예시:

```haproxy
frontend rg_game_tcp_{serverId}_{port}
    bind 0.0.0.0:{externalPort}
    mode tcp
    default_backend rg_game_tcp_{serverId}_{port}_backend

backend rg_game_tcp_{serverId}_{port}_backend
    mode tcp
    server target_game {targetInternalHost}:{targetPort} check
```

UDP 게임 포트 예시는 HAProxy UDP 지원 설치본 기준으로 별도 템플릿을 둔다. 구현 시 실제 설치본의 문법을 감지한 뒤 템플릿을 선택한다.

```haproxy
# UDP 지원 HAProxy 설치본 전용 템플릿
# 실제 지시어와 섹션 문법은 설치된 HAProxy 종류/버전에 맞춰 생성한다.
```

삭제 순서:

1. HAProxy 서버별 설정 블록 제거
2. `haproxy -c` 검증
3. `systemctl reload haproxy`
4. 경유 노드 방화벽에서 TCP/UDP 수신 포트 제거
5. Target Game Server Agent 정리
6. 로컬 서버 등록 정보 삭제

검증 항목:

- 경유 노드에 HAProxy가 설치되어 있는지 확인
- TCP 포트 경유 성공
- UDP 포트가 있는 경우 HAProxy UDP 지원 확인 후 경유 성공
- HAProxy 설정 검증 실패 시 reload하지 않음
- 서버 삭제 시 HAProxy 설정과 TCP/UDP 방화벽 규칙 제거
