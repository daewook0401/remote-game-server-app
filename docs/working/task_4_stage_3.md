# task_4 stage 3 보고서

## 단계 제목

Agent bootstrap command builder 분리

## 변경 파일

- 추가: `apps/desktop/electron/commands/systemdFragments.ts`
- 추가: `apps/desktop/electron/commands/downloadFragments.ts`
- 추가: `apps/desktop/electron/commands/agentBootstrapCommand.ts`
- 수정: `apps/desktop/electron/ssh/bootstrapScripts.ts`

## 변경 내용

- Agent env file content 생성을 `agentBootstrapCommand.ts` 내부 builder로 분리했다.
- systemd service file content 생성을 `systemdFragments.ts`로 분리했다.
- curl/wget 다운로드 command 생성을 `downloadFragments.ts`로 분리했다.
- Agent prepare/remove command 생성을 `agentBootstrapCommand.ts`로 이동했다.
- 기존 import 경로 호환을 위해 `ssh/bootstrapScripts.ts`는 새 builder를 재export하는 facade로 축소했다.
- Agent port firewall open/close command는 2단계 firewall fragment를 재사용하도록 변경했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck`: 성공
- `npm run desktop:build`: 성공

## 실패 또는 특이사항

- 기존 Agent install path, service name, state file path, env key는 변경하지 않았다.
- 원격 서버에 실제 Agent install/update/remove를 실행하는 수동 검증은 하지 않았다.
- 기존 `ssh/bootstrapScripts.ts` export 이름은 유지했다.

## 다음 단계

4단계에서 HAProxy install/apply/remove command builder와 config block renderer를 분리한다.
