# task_3 단계 11 보고: 서버 추가 스크롤 및 Agent API 접근 실패 안내

## 단계 제목

서버 추가 모달 스크롤과 HAProxy CIDR 입력 안전장치 보강

## 변경 파일

- `apps/desktop/src/styles.css`
- `apps/desktop/src/components/ServerRegistrationPanel.tsx`
- `apps/desktop/src/services/serverRegistrationModel.ts`
- `apps/desktop/src/pages/ServerManagementPage.tsx`
- `docs/troubleshooting/task_3_agent_api_fetch_blocked.md`

## 변경 내용

- 서버 추가 모달이 화면 높이를 넘으면 모달 내부/오버레이에서 스크롤되도록 수정했다.
- `허용 IP/CIDR` placeholder를 실제 값처럼 보이는 문서 예시 IP에서 정책 설명 문구로 바꿨다.
- `192.0.2.x`, `198.51.100.x`, `203.0.113.x` 문서 예시용 CIDR이 입력되면 HAProxy route 적용 전 차단한다.
- 서버 등록 시에도 예시용 CIDR이면 Agent API fetch 전에 명확한 안내를 표시한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
