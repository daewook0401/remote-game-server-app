# task_3 최종 보고서

## 배경

사용자는 외부망 접근 노드와 내부망 게임 서버가 분리된 환경에서 서버 등록, Agent 설치, Agent 확인, 게임 포트 경유를 처리해야 한다. TCP/UDP 경유는 외부망 노트북 또는 점프 노드에 설치된 HAProxy를 통해 내부망 서버로 연결하는 방식으로 확정했다.

## 원인 또는 설계 판단

- 내부망 서버는 외부에서 직접 접근되지 않으므로 직접 SSH와 별도의 경유 모델이 필요했다.
- Agent `18080`은 관리 포트이므로 무분별한 직접 공개나 DNAT보다 앱이 추적 가능한 HAProxy 경유 방식이 적합하다.
- TCP/UDP 경유를 HAProxy로 통일하면 앱이 설정 생성, 검증, reload, 삭제를 같은 흐름으로 관리할 수 있다.

## 변경 내용

- 서버 모델에 접속 경로, Agent 접근 방식, HAProxy 경유 노드 정보를 추가했다.
- 서버 등록 UI에 `직접 SSH 연결`, `외부망 HAProxy 경유`, `직접 공개 예외` 선택을 추가했다.
- 외부망 HAProxy 노드 SSH 정보, 허용 IP/CIDR, Agent proxy port 입력을 추가했다.
- Electron SSH 실행 경로가 점프 노드 경유를 지원하게 했다.
- HAProxy 설치 확인, 설정 적용, 설정 제거 IPC와 renderer 클라이언트를 추가했다.
- Agent 설치 후 HAProxy route 생성과 Agent API 확인을 수행하고, Agent 확인 실패 시 서버 등록을 차단했다.
- 게임 서버 생성 시 HAProxy 경유 서버는 게임 TCP 포트 route를 HAProxy 설정으로 추가한다.
- 서버 삭제 시 HAProxy 설정 제거 후 Agent 정리를 수행한다.
- 버튼 hover/cursor/active 및 등록 버튼 pending 상태를 추가했다.
- 서버 등록/HAProxy 요청 생성 로직을 `serverRegistrationModel.ts`로 분리했다.
- 서버 삭제 모달과 게임 서버 생성 확인 모달을 별도 컴포넌트로 분리했다.
- HAProxy가 없는 경유 노드에서는 설치 확인 모달을 띄우고, sudo 비밀번호 입력 후 OS/패키지 매니저 감지 기반 설치를 시도하도록 했다.
- Agent 업데이트 모달과 컨테이너 삭제 모달을 별도 컴포넌트로 분리했다.
- 서버 상세 화면을 `ServerDetailView.tsx`로 분리하고, 서버 생성 readiness 계산을 `serverReadiness.ts`로 분리했다.

## 검증 결과

```bash
npm run desktop:typecheck
npm run desktop:build
```

두 명령 모두 통과했다.

## 영향 범위

- Desktop renderer의 서버 등록 UI와 서버 관리 페이지
- Electron main process의 SSH, Agent, HAProxy IPC
- 서버 저장 모델
- 원격 HAProxy 설정 생성/삭제 명령

## 남은 위험

- HAProxy UDP 지원은 설치본/모듈에 따라 달라 실제 환경 검증이 필요하다.
- HAProxy 설정 파일 구조가 배포판마다 다를 수 있어 실서버 테스트에서 보정이 필요할 수 있다.
- password 인증 기반 경유 노드는 운영 UX와 보안 측면에서 SSH key 인증보다 불안정하다.

## 교훈

- Agent 관리 포트와 게임 접속 포트를 같은 “외부 공개”로 다루면 보안 경계가 흐려진다.
- 포트 경유는 DNAT보다 앱이 추적 가능한 HAProxy 설정 모델이 제품화에 유리하다.

## 후속 작업

- 사용자의 실서버 검수 피드백을 바탕으로 HAProxy 설정 템플릿과 UDP 지원 감지 로직을 조정한다.
- 필요 시 HAProxy 설치 자동화와 UDP 지원 설치 가이드를 별도 단계로 추가한다.
