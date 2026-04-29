# task_4 stage 5 보고서

## 단계 제목

detection command 분리

## 변경 파일

- 추가: `apps/desktop/electron/commands/detectionCommand.ts`
- 수정: `apps/desktop/electron/ssh/detection.ts`

## 변경 내용

- Windows, macOS, Linux detection command 생성을 `detectionCommand.ts`로 분리했다.
- 기존 `ssh/detection.ts`는 `osDetectionCommand`를 재export하고, OS/Docker/Agent parser 책임만 유지하도록 축소했다.
- detection section marker와 Docker/Agent sentinel 참조는 기존 상수 구조를 유지했다.
- 기존 `sshDiagnosticsService.ts`의 import 경로는 변경하지 않았다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck`: 성공
- `npm run desktop:build`: 성공

## 실패 또는 특이사항

- 실제 Windows/macOS/Linux 서버에서 detection command를 실행하는 수동 검증은 하지 않았다.
- parser 함수 이름과 기존 export 경로는 유지했다.

## 다음 단계

1~5단계 구현은 완료되었다. 전체 변경 범위와 남은 위험은 최종 보고서에 정리한다.
