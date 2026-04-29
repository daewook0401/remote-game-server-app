# task_4 stage 1 보고서

## 단계 제목

default/config와 sentinel 분리

## 변경 파일

- 추가: `apps/desktop/electron/config/remoteDefaults.ts`
- 추가: `apps/desktop/electron/commands/sentinels.ts`
- 수정: `apps/desktop/electron/ssh/bootstrapScripts.ts`
- 수정: `apps/desktop/electron/ssh/haproxyScripts.ts`
- 수정: `apps/desktop/electron/ssh/detection.ts`
- 수정: `apps/desktop/electron/services/agentBootstrapService.ts`
- 수정: `apps/desktop/electron/services/haproxyService.ts`
- 수정: `apps/desktop/electron/services/firewallService.ts`
- 수정: `apps/desktop/electron/services/sshDiagnosticsService.ts`

## 변경 내용

- Agent install path, service name, Agent port, Agent state file path, HAProxy config path, HAProxy managed marker prefix를 `remoteDefaults.ts`로 분리했다.
- Agent, HAProxy, firewall, detection 출력 sentinel을 `sentinels.ts`로 분리했다.
- Agent/HAProxy/firewall service의 stdout 판별 로직이 직접 문자열 대신 sentinel 상수를 참조하도록 변경했다.
- OS/Docker/Agent detection section marker를 상수 참조로 변경했다.
- 기존 Agent path, service name, HAProxy marker, 출력 sentinel 값은 변경하지 않았다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck`: 성공
- `npm run desktop:build`: 성공

## 실패 또는 특이사항

- 원격 서버에 실제 SSH command를 실행하는 수동 검증은 하지 않았다.
- 이번 단계는 값 분리만 수행했으며 command builder 구조 분리는 2단계부터 진행한다.

## 다음 단계

2단계에서 공통 shell utility와 firewall fragment를 분리한다.
