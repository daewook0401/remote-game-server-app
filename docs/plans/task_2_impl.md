# task_2 구현계획서

## 분석 결과

- 현재 내비게이션은 `AppRoute = "servers" | "console" | "publish" | "guides"`로 구성되어 있고, `Sidebar`와 `App`이 이 라우트를 그대로 렌더링한다.
- 콘솔 기능은 `ConsolePage` 안에서 저장 서버를 다시 불러오고 컨테이너를 다시 선택하는 독립 페이지 구조다.
- 서버 선택 상세 화면에는 이미 선택 서버(`activeServer`)와 컨테이너 목록(`containers`) 상태가 있으므로, 콘솔을 이 화면 안으로 옮기면 중복 서버 선택을 제거할 수 있다.
- Agent 상태 확인은 `handleCheckAgent`와 `handleCheckServer`가 각각 유사한 로직을 갖고 있다. 자동 확인을 추가하려면 서버 ID를 인자로 받는 내부 함수로 조회 로직을 정리하는 편이 중복을 줄인다.
- Docker 컨테이너 콘솔 API는 이미 프론트 클라이언트에 `getConsoleSnapshot`, `sendConsoleCommand`로 준비되어 있어 백엔드 변경은 필요하지 않다.

## 확정한 원인 또는 설계 방향

- 기능 단위 독립 메뉴였던 `콘솔`, `외부 공개`를 제거하고, `서버 선택`을 부모 흐름으로 둔다.
- 서버 카드에서는 `상태 확인` 버튼을 제거하고 `들어가기`, `삭제`만 남긴다.
- 서버 상세 화면에 들어가면 선택된 서버에 대해 Agent 상태 확인과 컨테이너 목록 조회를 자동으로 한 번 실행한다.
- 자동 확인은 서버별로 한 번만 실행되도록 `autoCheckedServerIds` 같은 상태를 두고, 수동 재확인은 기존 `Agent 상태 확인` 버튼으로 유지한다.
- 콘솔 UI는 독립 페이지가 아니라 재사용 가능한 컴포넌트로 분리해 서버 상세 화면의 모달에서 사용한다.
- `외부 공개`는 사용자가 접근할 수 없도록 라우트와 사이드바에서 제거한다. 관련 파일과 서비스는 이번 단계에서 삭제하지 않고 미사용 상태로 둔다. 삭제는 영향 범위가 커질 수 있어 별도 작업으로 분리하는 것이 안전하다.
- Agent 18080 포트는 Docker 제어 API이므로 일반 공개 포트처럼 다루면 안 된다. 이번 작업에는 최소 보안 가드와 안내를 포함하고, Agent 설치 기본값 변경은 영향이 커서 별도 승인 대상으로 둔다.
- 원격/클라우드 Agent token은 사용자가 직접 입력하지 않아도 앱이 자동 생성하고, SSH 설치 스크립트와 로컬 서버 저장 정보에 같은 값을 적용하는 방향으로 확정한다.
- 서버 삭제는 현재 로컬 등록 정보만 제거하므로, 원격 Agent 정리 옵션과 삭제 순서가 필요하다.

## 수정 예정 파일

- `apps/desktop/src/types/navigation.ts`
- `apps/desktop/src/layout/Sidebar.tsx`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/components/ContainerConsolePanel.tsx` 신규
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/pages/ConsolePage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/electron/services/agentBootstrapService.ts`
- `apps/desktop/electron/ssh/bootstrapScripts.ts`
- `apps/desktop/electron/ipc/registerIpc.ts`
- `apps/desktop/electron/types.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/src/services/agentBootstrapClient.ts`
- `apps/desktop/electron/ssh/bootstrapScripts.ts` 보안 기본값 변경 필요성 검토
- `docs/feedback/task_2_agent_port_security.md`
- `docs/tech/agent-security-hardening.md`
- `docs/orders/20260429.md`
- `docs/working/task_2_stage_1.md`
- `docs/working/task_2_stage_2.md`
- `docs/report/task_2_report.md`

## 파일별 변경 계획

- `navigation.ts`
  - `AppRoute`를 `servers | guides`로 축소한다.
- `Sidebar.tsx`
  - `TerminalSquare`, `Wifi` 아이콘 import와 메뉴 항목을 제거한다.
  - 사이드바에는 `서버 선택`, `안내 가이드`만 남긴다.
- `App.tsx`
  - `ConsolePage`, `PublishSettingsPage` import와 라우트 렌더링을 제거한다.
- `ServerCard.tsx`
  - `onCheck` prop과 `상태 확인` 버튼을 제거한다.
  - 카드 액션은 `들어가기`, `삭제`만 남긴다.
- `ContainerTable.tsx`
  - `onOpenConsole?: (container: ContainerSummary) => void` prop을 추가한다.
  - 작업 버튼 그룹에 `콘솔` 버튼을 추가한다.
  - 컨테이너가 실행 중일 때만 콘솔 버튼을 활성화할지 여부는 구현 중 기존 Agent API 동작을 확인해 결정하되, 기본은 버튼 노출 후 API 오류를 메시지로 보여주는 흐름으로 둔다.
- `ContainerConsolePanel.tsx`
  - 서버 이름, Agent URL, 컨테이너 정보를 props로 받는다.
  - 마운트 시 해당 컨테이너의 콘솔 스냅샷을 불러온다.
  - 새로고침, 명령 전송, 출력 표시를 담당한다.
  - 기존 `ConsolePage`의 콘솔 출력/입력 UX를 서버 선택 없는 형태로 옮긴다.
- `ServerManagementPage.tsx`
  - 콘솔 관련 API import를 추가한다.
  - `handleCheckAgent` 로직을 서버 ID 기반 내부 함수로 정리하고 수동/자동 호출에서 재사용한다.
  - 상세 서버가 정해지고 저장소 로딩이 끝난 뒤, 해당 서버를 자동 확인하지 않았다면 한 번 조회한다.
  - 자동 조회 중복 방지를 위해 서버 ID 기록 상태를 둔다.
  - 컨테이너 행의 `콘솔` 버튼 클릭 시 선택 컨테이너를 저장하고 모달을 연다.
  - 서버 카드 렌더링에서 `onCheck` 전달을 제거한다.
  - 원격/클라우드 Agent token이 비어 있으면 자동 생성해 등록/설치 흐름에 사용한다.
  - 서버 삭제 모달에서 `앱 등록 정보만 삭제`와 `원격 Agent와 데이터까지 삭제` 옵션을 제공한다.
  - 원격 Agent 삭제 성공 후 로컬 등록 정보를 삭제한다.
- `ConsolePage.tsx`
  - 라우트에서 제거되므로 직접 사용되지 않는다.
  - 콘솔 UI를 `ContainerConsolePanel`로 옮긴 뒤 파일은 남긴다. 삭제는 import 영향과 향후 재사용 여부 판단이 필요하므로 이번 범위에서는 접근 제거까지만 처리한다.
- `styles.css`
  - 콘솔 모달 안에서 기존 `.consolePanel`, `.terminalOutput`, `.terminalInput`이 깨지지 않도록 필요한 최소 스타일만 추가 또는 조정한다.
- `bootstrapScripts.ts`
  - 현재 자동 설치는 `AGENT_ADDR=0.0.0.0:18080`을 사용한다.
  - 이번 구현 승인 시 즉시 변경할지, SSH 터널 설계와 함께 별도 task로 분리할지 결정한다.
  - 최소 조치로 Agent token이 비어 있는 원격 설치를 막거나 경고하는 UI를 검토한다.
  - Agent token 자동 생성값을 `.env`의 `AGENT_TOKEN`에 적용하는 흐름을 명확히 유지한다.
  - Agent 삭제용 원격 명령을 추가한다. 삭제 명령은 서비스 중지, 비활성화, 서비스 파일 삭제, `18080/tcp` 방화벽 허용 규칙 삭제, `/opt/remote-game-agent` 삭제 순서로 구성한다.
- `agentBootstrapService.ts`, `registerIpc.ts`, `preload.ts`, `types.ts`, `agentBootstrapClient.ts`
  - 원격 Agent 삭제 IPC와 클라이언트 함수를 추가한다.
  - SSH 비밀번호 또는 키 인증 정보를 받아 삭제 명령을 실행한다.
- 문서
  - 단계별 보고서와 최종 보고서를 작성하고, 오늘 할 일 상태를 갱신한다.

## 단계 분할

1. 내비게이션과 서버 카드 정리
   - 사이드바에서 `콘솔`, `외부 공개` 제거
   - 라우트 타입과 `App.tsx` 정리
   - 서버 카드의 `상태 확인` 버튼 제거
   - 검증: `npm run desktop:typecheck`
   - 보고서: `docs/working/task_2_stage_1.md`
2. 서버 상세 자동 확인 및 게임 서버별 콘솔 연결
   - 서버 상세 진입 시 Agent 상태 확인 자동 1회 실행
   - 컨테이너별 `콘솔` 버튼 추가
   - 콘솔 패널 컴포넌트 생성 및 모달 연결
   - Agent URL/토큰 상태에 따른 보안 경고 표시
   - 검증: `npm run desktop:typecheck`, `npm run desktop:build`
   - 보고서: `docs/working/task_2_stage_2.md`
3. Agent 포트 보안 조치 범위 확정
   - 원격 Agent 설치 시 토큰 자동 생성/적용을 구현한다.
   - 토큰 원문은 기본 노출하지 않고 설정 상태만 표시한다.
   - 18080 외부 공개 대신 SSH 터널 우선 구조를 별도 task로 작성할지 확정
   - 검증: 관련 타입체크 및 보안 경고 수동 확인
4. 서버 삭제 시 Agent 정리 추가
   - 서버 삭제 확인 모달을 추가한다.
   - 원격 서버는 `Agent 서비스 종료/삭제 -> 18080/tcp 방화벽 규칙 삭제 -> Agent 데이터 삭제 -> 로컬 등록 정보 삭제` 순서로 처리한다.
   - 원격 정리 실패 시 로컬 등록 정보 삭제를 자동 진행하지 않고 사용자 선택을 받는다.
   - 클라우드 보안 그룹이나 공유기 포트포워딩처럼 서버 내부에서 닫을 수 없는 18080 규칙은 수동 정리 안내를 표시한다.
   - 검증: 관련 타입체크 및 삭제 명령 문자열 검토
5. 최종 문서화
   - 검증 결과와 남은 위험 정리
   - `docs/report/task_2_report.md` 작성
   - `docs/orders/20260429.md` 상태 갱신

## 테스트 계획

- 타입 검증: `npm run desktop:typecheck`
- 빌드 검증: `npm run desktop:build`
- 수동 확인 항목:
  - 사이드바에 `서버 선택`, `안내 가이드`만 보인다.
  - 서버 카드에서 `상태 확인` 버튼이 사라진다.
  - 서버 상세 진입 시 Agent 상태 확인이 자동으로 한 번 실행된다.
  - 같은 서버 상세 화면에서 렌더링만 반복될 때 자동 확인이 반복되지 않는다.
  - Docker 컨테이너 행에 `콘솔` 버튼이 보인다.
  - `콘솔` 버튼으로 열린 모달이 해당 서버/컨테이너의 콘솔 스냅샷을 요청한다.
  - 콘솔 명령 전송이 선택 컨테이너 ID와 선택 서버 Agent URL을 사용한다.
  - 원격 Agent URL인데 토큰이 비어 있거나 외부 IP로 18080을 직접 가리키면 보안 경고가 보인다.
  - 원격/클라우드 Agent 설치 시 토큰이 자동 생성되고 `ManagedServer.agentToken`에 저장된다.
  - 토큰이 설정된 서버의 Agent 요청에 Authorization 헤더가 자동 첨부된다.
  - 서버 삭제 시 원격 Agent 삭제 옵션을 선택하면 Agent 서비스, Agent 데이터, 18080 방화벽 규칙 정리 후 로컬 등록 정보가 삭제된다.
  - 원격 Agent 삭제 실패 시 로컬 등록 정보가 자동 삭제되지 않는다.

## 위험 요소

- 자동 Agent 상태 확인은 네트워크 실패 또는 Agent 미실행 상태에서 오류 토스트를 발생시킬 수 있다. 다만 서버 상세 진입 직후 상태를 알려주는 것이 목표 UX와 맞다.
- React 상태 업데이트 흐름에 따라 자동 확인이 두 번 실행될 위험이 있다. 서버 ID 기록 상태와 로딩 완료 조건으로 방지한다.
- `ConsolePage` 파일을 남기면 미사용 파일이 남지만, 이번 변경에서 삭제하면 범위가 넓어질 수 있다. 접근 경로 제거를 우선한다.
- `외부 공개` 관련 서비스와 페이지 파일은 남지만 라우트에서 제거되어 사용자가 접근하지 못한다. 완전 삭제는 별도 승인 대상이다.
- 현재 원격 Agent 자동 설치는 `0.0.0.0:18080` 바인딩을 사용한다. 토큰이 없거나 방화벽이 넓게 열려 있으면 Docker 제어 API가 노출된다.
- 18080 포트를 인터넷에 직접 공개하는 방식은 토큰이 있어도 평문 HTTP이므로 권장하지 않는다. SSH 터널, VPN, 방화벽 허용 IP 제한 같은 접근 제어가 필요하다.
- 자동 생성 토큰을 현재 로컬 저장소에 저장하면 평문 저장 위험이 남는다. MVP에서는 위험을 줄이는 1차 조치로 보고, OS 보안 저장소 연동은 별도 task로 분리한다.
- 서버 삭제에서 Agent 데이터를 삭제해도 게임 서버 컨테이너와 게임 데이터 볼륨은 별도 확인 없이 삭제하지 않는다.
- 서버 내부 방화벽 규칙은 자동 삭제할 수 있지만, 클라우드 보안 그룹과 공유기 포트포워딩은 자동 삭제 범위 밖일 수 있다.

## 승인 요청

위 구현계획으로 소스 변경을 진행해도 되는지 승인 요청드립니다.

승인되면 1단계부터 진행하고, 단계별 검증 후 `docs/working/task_2_stage_1.md` 보고서를 작성하겠습니다.

추가 승인 필요:

- Agent 18080 포트 보안 조치를 이번 task_2에 포함할지 결정이 필요합니다.
- 권장안은 원격 Agent 설치/등록에서 토큰을 자동 생성/적용하고, 서버 삭제 시 Agent 정리 옵션을 추가하며, 외부 공개 대신 SSH 터널 우선 구조는 별도 task로 설계하는 것입니다.
