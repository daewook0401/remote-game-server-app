# task_3 stage_2 보고서

## 단계 제목

`ServerManagementPage.tsx` 분할 및 등록/HAProxy 모델 정리

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `apps/desktop/src/services/serverRegistrationModel.ts`
- `apps/desktop/src/components/ServerDeleteModal.tsx`
- `apps/desktop/src/components/CreateServerConfirmModal.tsx`

## 변경 내용

- 서버 등록 기본값, Agent URL 생성, Target SSH 요청 생성, HAProxy 요청 생성 로직을 `serverRegistrationModel.ts`로 분리했다.
- `ServerManagementPage.tsx`에 있던 서버 삭제 모달 UI를 `ServerDeleteModal.tsx`로 분리했다.
- 게임 서버 생성 확인 모달 UI를 `CreateServerConfirmModal.tsx`로 분리했다.
- 페이지 파일의 라인 수를 약 1975줄에서 1652줄로 줄였다.
- 기존 HAProxy 경유 구현의 동작은 유지하면서 다음 단계에서 더 작은 단위로 분리할 기반을 만들었다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- `npm run desktop:typecheck` 통과
- `npm run desktop:build` 통과

## 실패 또는 특이사항

- `ServerManagementPage.tsx`는 아직 크다. 컨테이너 삭제 모달, Agent 업데이트 모달, 서버 상세 영역을 추가 분리할 여지가 남아 있다.

## 다음 단계

- 사용자가 돌아오면 실서버 검수 피드백을 우선 반영한다.
- 피드백 전 시간이 더 있으면 컨테이너 삭제 모달과 서버 상세 패널을 추가 분리한다.

## 승인 요청

분할 리팩터링 1차는 검증까지 완료했다.
