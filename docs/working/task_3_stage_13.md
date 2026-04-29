# task_3 단계 13 보고: HAProxy 경유 게임 생성 내부망 포트 개방

## 단계 제목

게임 생성 시 내부망 서버 게임 포트 방화벽 개방 추가

## 변경 파일

- `apps/desktop/src/pages/ServerManagementPage.tsx`

## 변경 내용

- HAProxy 경유 서버에서 게임을 생성할 때 내부망 서버의 게임 호스트 포트를 먼저 연다.
- 내부망 서버 포트 개방 후 HAProxy 외부 route를 적용한다.
- HAProxy backend target port를 컨테이너 내부 포트가 아니라 내부망 서버의 호스트 공개 포트로 맞췄다.
- 내부망 서버 포트 개방은 저장된 서버 SSH 정보와 생성 확인 모달의 sudo 비밀번호를 사용한다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.
