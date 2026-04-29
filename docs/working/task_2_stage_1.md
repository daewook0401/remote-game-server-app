# task_2 단계 1 보고서

## 단계 제목

내비게이션과 서버 카드 정리

## 변경 파일

- `apps/desktop/src/types/navigation.ts`
- `apps/desktop/src/layout/Sidebar.tsx`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/components/ServerCard.tsx`
- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- 앱 라우트 타입에서 `console`, `publish`를 제거하고 `servers`, `guides`만 남겼다.
- 사이드바 메뉴에서 `콘솔`, `외부 공개`를 제거하고 `서버 선택`, `안내 가이드`만 남겼다.
- `App.tsx`에서 독립 `ConsolePage`, `PublishSettingsPage` 렌더링과 import를 제거했다.
- 서버 카드에서 `상태 확인` 버튼과 `onCheck` prop을 제거했다.
- 서버 선택 목록에서 `ServerCard`에 `onCheck`를 전달하던 코드를 제거했다.

## 실행한 검증 명령

```powershell
npm run desktop:typecheck
```

## 검증 결과

- 성공
- TypeScript renderer/electron 타입체크가 모두 통과했다.

## 실패 또는 특이사항

- 없음

## 다음 단계

- 서버 상세 진입 시 Agent 상태 확인 자동 1회 실행을 추가한다.
- Docker 컨테이너 행에 `콘솔` 버튼을 추가하고 서버 상세 안에서 콘솔 패널 또는 모달을 연결한다.
- Agent token 자동 생성/적용과 서버 삭제 시 Agent/18080 방화벽 정리 흐름은 승인된 보안 범위에 맞춰 다음 단계에서 반영한다.

## 승인 요청

1단계 변경 완료 보고드립니다.

다음 단계 진행 승인을 요청드립니다.
