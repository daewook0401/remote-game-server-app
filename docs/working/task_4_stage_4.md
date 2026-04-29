# task_4 stage 4 보고서

## 단계 제목

HAProxy script builder 분리

## 변경 파일

- 추가: `apps/desktop/electron/commands/haproxyConfigRenderer.ts`
- 추가: `apps/desktop/electron/commands/haproxyInstallCommand.ts`
- 추가: `apps/desktop/electron/commands/haproxyRouteCommand.ts`
- 수정: `apps/desktop/electron/ssh/haproxyScripts.ts`

## 변경 내용

- HAProxy frontend/backend config block 생성을 `haproxyConfigRenderer.ts`로 분리했다.
- HAProxy status/install command 생성을 `haproxyInstallCommand.ts`로 분리했다.
- HAProxy apply/remove route command 생성을 `haproxyRouteCommand.ts`로 분리했다.
- 기존 import 경로 호환을 위해 `ssh/haproxyScripts.ts`는 새 builder들을 재export하는 facade로 축소했다.
- 기존 HAProxy managed marker prefix와 backup suffix는 변경하지 않았다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck`: 성공
- `npm run desktop:build`: 성공

## 실패 또는 특이사항

- HAProxy config를 실제 서버에 적용하는 수동 검증은 하지 않았다.
- 기존 managed block 정리 방식과 marker prefix는 호환성 때문에 유지했다.
- UDP route는 기존처럼 HAProxy 지원 여부를 확인하고, generic template에서는 실제 UDP block을 렌더링하지 않는다.

## 다음 단계

5단계에서 OS/Docker/Agent detection command를 OS별 builder로 분리한다.
