# task_3 수행계획서

## 작업 제목

점프 서버 경유 접속 옵션 및 SSH 터널 기반 Agent 접근 설계

## 목표

- 서버 추가 화면에 `직접 SSH 연결`, `점프 서버 경유`, `직접 공개 예외` 접속 경로 옵션을 추가한다.
- 외부망 점프 서버를 통해 내부망 대상 게임 서버에 접근할 수 있게 한다.
- Agent 설치, Agent 상태 확인, Docker 컨테이너 조회, 콘솔, 서버 삭제 정리 명령이 모두 같은 접속 경로를 사용하게 한다.
- 내부망 대상 서버의 Agent `18080` 포트는 외부에 열지 않고, SSH 터널을 통해 Desktop 앱에서 접근하는 구조를 설계한다.
- `127.0.0.1` Agent 주소가 로컬 Agent인지, 직접 SSH 터널인지, 점프 서버 경유 터널인지 UI와 내부 상태에서 구분한다.
- 서버 등록 플로우를 `SSH 확인 -> Agent 설치 및 Agent 포트 설정 -> Agent API 확인 -> 서버 등록` 순서로 강제한다.
- 서버 등록은 Agent가 실제로 확인된 경우에만 가능하게 한다.
- 점프 서버 경유 시 Agent 포트 설정 명령은 점프 서버가 아니라 실제 Agent가 설치된 내부망 대상 서버에서 실행한다.
- 등록 완료 후 서버 상세 화면에서는 `Agent 설치` 버튼을 제거하고, `Agent 업데이트`와 상태 확인 중심으로 유지한다.
- 클릭 가능한 버튼은 마우스 커서와 시각적 상태로 명확히 구분하고, 요청 처리 중에는 로딩 상태를 표시한다.
- 비동기 요청 버튼은 처리 중 중복 클릭을 막고 성공/실패 결과가 돌아올 때까지 사용자가 진행 중임을 알 수 있게 한다.

## 현재 현상 또는 요구사항

- 현재 서버 등록은 대상 서버 SSH 정보만 입력하는 구조다.
- 내부망 게임 서버가 외부에서 직접 접근되지 않고, 외부망 점프 서버를 통해서만 접근해야 하는 환경을 지원하지 않는다.
- 현재 원격 Agent 자동 설치는 직접 대상 서버로 SSH 접속하는 흐름을 전제로 한다.
- 현재 Agent API 접근은 `agentBaseUrl`에 저장된 URL로 직접 HTTP 요청을 보내는 구조다.
- 사용자는 외부망 접근 서버와 내부망 대상 서버가 분리된 환경을 서버 추가 옵션으로 지원하길 원한다.
- 사용자는 서버 등록 화면에서 `SSH 확인 -> Agent 설치(Agent 포트 설정 포함) -> 서버 등록` 순서를 강제하길 원한다.
- 사용자는 Agent 확인이 완료된 서버만 등록되길 원한다.
- 사용자는 버튼이 눌러지는지 마우스 커서와 시각적 반응으로 알 수 있길 원한다.
- 사용자는 SSH 확인, Agent 설치, 포트 설정, 서버 등록처럼 시간이 걸리는 요청에서 로딩 상태를 볼 수 있길 원한다.
- 사용자는 점프 서버 경유 환경에서 포트 개방도 `점프 서버 -> 실제 설치 서버` 경로로 넘어가 실제 Agent 설치 서버에 적용되길 원한다.
- 사용자는 이미 등록된 서버 상세 화면에서는 `Agent 설치` 버튼이 필요 없고 `Agent 업데이트`만 있으면 된다고 판단한다.

## 재현 방법 또는 확인 방법

1. 서버 추가 화면을 연다.
2. 현재 입력 항목에 대상 서버 SSH 정보만 있고 점프 서버 경유 옵션이 없는지 확인한다.
3. 내부망 서버의 SSH host가 외부 Desktop에서 직접 접근되지 않는 경우 현재 구조로는 SSH 확인, Agent 설치, 상태 확인을 진행할 수 없는지 확인한다.
4. Agent URL이 `127.0.0.1`로 표시될 때 로컬 Agent인지 SSH 터널인지 점프 서버 경유 터널인지 구분하는 상태가 없는지 확인한다.
5. 현재 서버 등록 버튼을 누르면 SSH 확인 또는 Agent 확인이 완료되지 않아도 등록 정보가 저장될 수 있는지 확인한다.
6. 클릭 가능한 버튼에 마우스를 올렸을 때 커서가 바뀌는지 확인한다.
7. SSH 확인, Agent 설치, 서버 등록 같은 요청 버튼을 눌렀을 때 요청 중 상태가 표시되는지 확인한다.

## 원인 가설

- 서버 연결 모델이 `local`, `remote`, `cloud` 대상 유형 중심이고, 네트워크 접속 경로를 별도 모델로 분리하지 않았다.
- SSH 실행 함수가 단일 SSH 대상 접속만 지원하고, 점프 서버 경유 연결 또는 터널 생성을 지원하지 않는다.
- Agent API 클라이언트가 저장된 `agentBaseUrl`로 바로 요청하기 때문에, 터널 주소와 실제 대상 Agent 주소를 분리하지 않았다.
- 서버 등록 플로우가 단계 상태를 엄격히 관리하지 않아, Agent 설치/확인 전에도 서버 등록이 가능하다.
- 버튼 기본 스타일은 클릭 가능 상태와 처리 중 상태를 충분히 표현하지 못한다.
- 비동기 요청별 pending 상태가 버튼 UI에 일관되게 연결되어 있지 않다.
- 포트 설정 흐름이 대상 서버 기준인지 점프 서버 기준인지 명확하지 않으면 점프 서버의 18080만 열고 실제 Agent 설치 서버는 닫힌 상태가 될 수 있다.
- 서버 등록 조건을 Agent 설치/확인 성공으로 강제하면 등록 후 상세 화면의 `Agent 설치` 버튼은 중복 기능이 된다.

## 영향 범위

- `apps/desktop/src/types/server.ts`: 접속 경로, 점프 서버 정보, 터널 상태 타입 추가
- `apps/desktop/electron/types.ts`: main process SSH 요청 타입 확장
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`: 접속 경로 선택 및 점프 서버 입력 UI 추가
- `apps/desktop/src/pages/ServerManagementPage.tsx`: 등록 단계 상태, 상세/자동 상태 확인/삭제 흐름에서 접속 경로 사용
- `apps/desktop/electron/ssh/sshClient.ts`: 점프 서버 경유 SSH 명령 실행 또는 터널 지원 추가
- `apps/desktop/electron/services/agentBootstrapService.ts`: Agent 설치/삭제가 점프 서버 경유 경로를 사용하도록 확장
- `apps/desktop/electron/ipc/registerIpc.ts`, `preload.ts`, `src/vite-env.d.ts`: 터널 준비/해제 IPC 추가 가능성 검토
- `apps/desktop/src/services/agentBootstrapClient.ts`: 터널 준비/해제 클라이언트 추가 가능성 검토
- `apps/desktop/src/services/agentClient.ts`: 실제 요청 URL을 `agentBaseUrl` 대신 해석된 Agent URL로 받는 구조 검토
- `apps/desktop/src/styles.css`: 버튼 hover/cursor/loading/disabled 상태 스타일 추가
- `apps/desktop/src/components/*`: 요청 버튼에 pending 상태와 로딩 문구 또는 로딩 표시 연결
- `docs/tech/agent-security-hardening.md`: 점프 서버 경유 정책 업데이트
- `docs/working/`, `docs/report/`: 단계별/최종 보고서 작성

## 검증 방법

- `npm run desktop:typecheck`
- `npm run desktop:build`
- 가능하면 사용자 환경에서 수동 테스트:
  - 점프 서버 SSH 접속 확인
  - 점프 서버를 통한 내부망 대상 서버 SSH 확인
  - 내부망 대상 서버 Agent 설치
  - Agent 설치 단계에서 실제 Agent 설치 서버의 Agent 포트 설정까지 함께 수행
  - 점프 서버 경유 시 점프 서버가 아니라 내부망 대상 서버에서 18080/tcp 방화벽 규칙이 설정됨
  - Agent API 확인 성공 전에는 서버 등록 버튼 비활성화 또는 차단
  - Agent API 확인 성공 후 서버 등록 가능
  - 등록된 서버 상세 화면에는 `Agent 설치` 버튼이 보이지 않음
  - 등록된 서버 상세 화면에는 수동 `Agent 상태 확인`과 `Agent 업데이트`만 남음
  - 클릭 가능한 버튼은 hover 시 pointer 커서와 시각적 반응이 보임
  - 요청 처리 중 버튼은 로딩 상태와 disabled 상태가 보임
  - 요청 처리 중 같은 버튼을 다시 눌러 중복 요청을 만들 수 없음
  - 내부망 대상 서버 Agent 상태 확인
  - 컨테이너 목록 조회 및 콘솔 열기
  - 서버 삭제 시 같은 접속 경로로 Agent/18080 정리

## 단계별 작업 개요

1. 연결 모델 설계
   - `connectionMode: directSsh | jumpSsh | directPublic` 형태의 접속 경로 모델을 확정한다.
   - 대상 서버 SSH 정보와 점프 서버 SSH 정보를 분리한다.
   - `agentBaseUrl`과 실제 요청에 사용할 `resolvedAgentUrl` 또는 터널 URL을 분리한다.
2. 서버 등록 UI 확장
   - 서버 추가 화면에 접속 경로 선택을 추가한다.
   - `점프 서버 경유` 선택 시 점프 서버 SSH 입력 영역을 표시한다.
   - 점프 서버 경유 모드는 SSH key 인증을 권장하되 password 인증 가능 여부를 구현계획에서 확정한다.
3. 서버 등록 단계 강제
   - 서버 등록 화면을 `SSH 확인`, `Agent 설치`, `서버 등록` 순서로 동작하게 한다.
   - `Agent 설치` 단계에서 Agent 설치와 Agent 포트 설정을 함께 수행한다.
   - 점프 서버 경유 시 Agent 설치와 포트 설정은 모두 내부망 대상 서버에서 실행한다.
   - Agent API 확인이 성공해야 `서버 등록`이 가능하게 한다.
   - 사용자가 입력값을 바꾸면 이전 단계 확인 상태를 무효화하는 기준을 구현계획에서 확정한다.
4. 버튼 상호작용 및 로딩 상태 정리
   - 클릭 가능한 버튼은 `cursor: pointer`, hover, active 상태를 명확히 표현한다.
   - disabled 버튼은 `not-allowed`와 낮은 대비로 클릭 불가를 명확히 표시한다.
   - SSH 확인, Agent 설치, Agent 포트 설정, Agent 확인, 서버 등록, 서버 삭제 요청에 pending 상태를 연결한다.
   - 처리 중인 버튼은 로딩 문구 또는 작은 spinner를 표시하고 중복 클릭을 막는다.
5. SSH 명령 경로 확장
   - SSH 확인, Agent 설치, Agent 포트 설정, Agent 삭제 명령이 직접 SSH와 점프 서버 경유를 모두 지원하도록 한다.
   - 점프 서버 경유 시 Desktop -> Jump Server -> Target Server 순서로 명령이 실행되도록 한다.
6. Agent 터널 경로 설계 및 구현
   - 내부망 대상 서버의 Agent는 `127.0.0.1:18080`에 바인딩하는 구조를 우선한다.
   - Desktop 앱은 로컬 동적 포트로 터널을 열고 Agent API 요청은 `http://127.0.0.1:<local-port>`를 사용한다.
   - 서버 상세 진입 시 터널 준비 후 자동 Agent 상태 확인을 실행한다.
7. UI 상태와 정리 흐름
   - 서버 상세에 `로컬`, `직접 터널`, `점프 서버 경유 터널`, `직접 공개` 상태를 표시한다.
   - 등록된 서버 상세의 `서버 준비` 영역에서 `Agent 설치` 버튼을 제거한다.
   - 서버 상세를 벗어나거나 앱 종료 시 터널 정리 방식을 설계한다.
   - 서버 삭제 시 Agent 정리 명령도 같은 접속 경로를 사용한다.
8. 검증 및 문서화
   - 타입체크/빌드 검증을 수행한다.
   - 수동 테스트가 필요한 항목은 명확히 남긴다.
   - 단계별 보고서와 최종 보고서를 작성한다.

## 승인 요청

위 계획으로 `task_3` 구현계획서를 작성해도 되는지 승인 요청드립니다.

특히 구현계획서에서 아래 사항을 확정하려고 합니다.

- 점프 서버 경유 접속을 SSH 터널 기반 Agent 접근 작업에 포함한다.
- `18080` Agent 포트는 내부망 대상 서버에서 외부 공개하지 않는 것을 기본으로 한다.
- `agentBaseUrl`은 실제 대상 정보로 남기고, 런타임 요청은 터널로 해석된 URL을 사용한다.
- Agent 설치, 상태 확인, 콘솔, 서버 삭제는 모두 같은 접속 경로를 사용한다.
- Agent 포트 설정은 Agent가 설치된 실제 대상 서버에서 실행되게 한다.
- 서버 등록은 SSH 확인과 Agent 설치/포트 설정, Agent API 확인이 끝난 뒤에만 가능하게 한다.
- 등록된 서버 상세에는 `Agent 설치` 버튼을 노출하지 않고 `Agent 업데이트`만 유지한다.
- 버튼 hover/cursor/disabled/loading 상태를 전역 기준으로 정리하고, 긴 요청 버튼에는 pending 상태를 연결한다.
## 추가 검토: iptables DNAT 포트 중계

사용자가 확인한 `iptables DNAT` 방식은 점프 서버가 외부에서 받은 포트를 내부 Target Game Server로 중계하는 방식이다. 이번 계획에서는 기본 Agent 관리 경로로 사용하지 않고, 다음처럼 별도 예외 옵션으로 분리한다.

- 기본 Agent 관리 API 접근은 SSH 터널을 사용한다.
- DNAT는 게임 서버 접속 포트를 외부에 노출해야 하는 경우에 우선 검토한다.
- Agent `18080` 포트에 DNAT를 적용하는 것은 `직접 공개 예외`로만 허용한다.
- Agent DNAT 예외를 허용할 경우 `AGENT_TOKEN`, 허용 IP 제한, 삭제 시 DNAT/방화벽 규칙 정리까지 필수 조건으로 둔다.
- 점프 서버 경유 구성에서 포트 개방/중계 규칙은 `Jump Server 외부 포트 -> Target Game Server 내부 포트` 관계를 명확히 저장하고 UI에 표시한다.
- 서버 삭제 시 Agent 정리와 함께 관련 DNAT 규칙, FORWARD 허용 규칙, 18080 방화벽 규칙을 정리 대상으로 포함한다.

결론적으로 DNAT는 쓸 수 있지만, Agent 제어 평면의 기본 경로가 아니라 게임 서버 트래픽 공개 또는 명시 승인된 직접 공개 예외로 취급한다.

## 추가 검토: Agent 18080 TCP proxy 중계

Agent `18080` 포트를 점프 서버에서 중계해야 하는 경우에는 DNAT보다 TCP proxy 방식을 우선 검토한다.

- TCP proxy는 점프 서버의 프로세스가 외부 요청을 받아 Target Game Server의 Agent로 전달하는 방식이다.
- Agent 관리 API는 기본적으로 SSH 터널을 사용하고, TCP proxy는 터널을 유지하기 어려운 환경의 명시적 예외로 둔다.
- TCP proxy는 DNAT보다 앱에서 생성/상태 확인/중지/삭제를 추적하기 쉽다.
- TCP proxy 구현체는 Agent 관리 포트와 게임 서버 포트 중계를 모두 다룰 수 있는 HAProxy를 우선 후보로 둔다.
- TCP proxy를 사용할 때도 `AGENT_TOKEN`, 허용 IP 제한, proxy 서비스 삭제, 18080 관련 방화벽 정리가 필수다.
- 점프 서버에는 `외부 수신 포트`, `허용 IP`, `Target Agent 주소`, `Target Agent 포트`, `proxy 서비스 이름`을 저장한다.
- 서버 삭제 시 순서는 `proxy 서비스 중지/삭제 -> Agent 서비스 중지/삭제 -> proxy/Agent 방화벽 정리 -> 로컬 SSH 등록 정보 삭제`로 둔다.

따라서 Agent `18080`의 공개형 중계가 꼭 필요하다면 `DNAT 직접 공개 예외`보다 `TCP proxy 직접 공개 예외`를 우선 옵션으로 계획한다.

HAProxy를 사용할 경우 Agent `18080`은 `mode tcp` 기반의 제한된 frontend/backend로 구성하고, 게임 서버 포트도 같은 HAProxy 인스턴스 안에서 별도 frontend/backend로 관리할 수 있다. 이렇게 하면 DNAT 규칙과 proxy 서비스가 섞이지 않고, 앱에서 포트 중계 상태를 하나의 방식으로 조회/삭제할 수 있다.

## 추가 확정: TCP/UDP 경유는 HAProxy로 통일

사용자 요구에 따라 외부망에서 내부망 서버로 포트를 경유시키는 경우 TCP/UDP 모두 HAProxy를 사용하는 정책으로 정리한다.

- HAProxy는 외부망에 접근 가능한 노트북 또는 점프 노드에 설치한다.
- 내부망 게임 서버는 외부에서 직접 노출하지 않고, 외부망 노트북의 HAProxy가 내부망 서버로 연결한다.
- TCP 게임 포트, UDP 게임 포트, Agent `18080` 예외 중계는 모두 HAProxy 경유 모델로 저장한다.
- 앱은 포트 경유 방식을 DNAT/iptables 직접 규칙으로 만들지 않고, HAProxy 설정 생성/검증/reload/삭제 흐름으로 관리한다.
- UDP 경유를 사용하려면 해당 HAProxy 설치본이 UDP proxy/load balancing을 지원하는지 사전 확인한다.
- UDP 지원이 없는 HAProxy 설치본이면 UDP 포트 경유 등록을 차단하고, HAProxy UDP 지원 설치 또는 모듈 설치 안내를 표시한다.

경유 노드 기준 구성:

```text
External Client
  -> External Network Laptop / Jump Node HAProxy
  -> Internal Network Target Game Server
```

따라서 `점프 서버`라는 표현은 구현 문서에서 `외부망 경유 노드`로 확장해 다룬다. 이 노드는 일반 서버일 수도 있고, 외부망과 내부망을 동시에 볼 수 있는 노트북일 수도 있다.
