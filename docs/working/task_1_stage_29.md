# Task 1 Stage 29: 게임 선택 중심 서버 생성 UX 피드백 반영

## 단계 제목

게임 서버 생성, 포트 개방, 삭제 흐름을 사용자 친화적으로 정리

## 변경 파일

- `docs/feedback/task_1_user_friendly_server_flow.md`
- `docs/orders/20260428.md`
- `apps/desktop/src/components/ToastViewport.tsx`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/components/ServerCreatePanel.tsx`
- `apps/desktop/src/components/ContainerTable.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/types/api.ts`
- `apps/desktop/src/types/server.ts`
- `services/agent/internal/docker/contracts.go`
- `services/agent/internal/docker/cli_adapter.go`
- `services/agent/internal/docker/memory_adapter.go`
- `services/agent/internal/docker/contracts_test.go`

## 변경 내용

- 사용자 피드백을 별도 문서로 기록한다.
- 일반 알림 토스트에 닫기 버튼을 추가한다.
- 원격 서버 등록 시 SSH host를 기준으로 Agent URL을 `http://{host}:18080`으로 자동 구성한다.
- 서버 생성 시 내부 포트는 게임 기본 포트로 고정하고 외부 포트만 수정하게 한다.
- 원격 서버 생성 시 방화벽 포트 개방 안내와 sudo 비밀번호 입력 모달을 거치게 한다.
- 컨테이너 삭제 시 컨테이너만 삭제와 전체 데이터 삭제를 선택하게 한다.
- Minecraft 컨테이너 생성 시 서비스 전용 볼륨 경로를 `/remote-game-server/volume/minecraft/{serverName}`로 연결한다.
- Agent가 관리 컨테이너의 볼륨 경로를 저장하고, 전체 데이터 삭제 요청 시 안전한 관리 경로만 삭제하도록 한다.
- 원격 업데이트 배포를 위해 Agent와 Desktop의 기대 Agent 버전을 `0.1.3`으로 올린다.

## 검증 방법

- UTF-8 인코딩 확인
- Desktop TypeScript typecheck
- Desktop build
- Agent Go test
- Agent Linux binary build

## 상태

완료

## 실행한 검증 명령

- `npm run desktop:typecheck`
- `npm run desktop:build`
- `go test ./...` (`services/agent`)
- `powershell -ExecutionPolicy Bypass -File scripts/build-agent-linux.ps1`
- `npm audit --json`

## 검증 결과

- Desktop TypeScript typecheck 성공.
- Desktop production build 성공.
- Agent Go test 성공.
- Linux Agent binary build 성공.
- npm audit 취약점 0개.
