# task_3 stage_4 보고서

## 단계 제목

`ServerManagementPage.tsx` 추가 분리

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/components/ServerDetailView.tsx`
- `apps/desktop/src/services/serverReadiness.ts`
- `docs/working/task_3_stage_4.md`
- `docs/report/task_3_report.md`

## 변경 내용

- 서버 상세 화면 렌더링 묶음을 `ServerDetailView.tsx`로 분리했다.
- 서버 생성 readiness 계산과 Docker 상태 메시지를 `serverReadiness.ts`로 분리했다.
- `ServerManagementPage.tsx` 라인 수를 약 1591줄에서 1493줄로 줄였다.
- 이전 분리까지 포함하면 최초 약 1975줄에서 1493줄까지 줄었다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck` 통과
- `npm run desktop:build` 통과

## 실패 또는 특이사항

- 아직 `ServerManagementPage.tsx`는 1493줄로 크다.
- 다음 절단면은 서버 등록 플로우와 컨테이너 액션 상태를 hook으로 분리하는 것이다.

## 다음 단계

- 실서버 검수 전 추가 분리를 계속할 경우 `useServerRegistrationFlow`, `useContainerActions`, `useServerDeletion` 같은 hook 단위로 나누는 것을 권장한다.

## 승인 요청

추가 분리와 빌드 검증을 완료했다.
