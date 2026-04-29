# task_3 트러블슈팅: Agent 설치 버튼 클릭 이벤트 clone 오류

## 증상

- SSH 확인은 성공하지만 `Agent 설치` 버튼을 누르면 `An object could not be cloned.` 오류가 계속 표시된다.

## 최종 원인

- `Agent 설치` 버튼이 `onClick={onPrepareAgent}` 형태로 연결되어 React 클릭 이벤트 객체가 `handlePrepareAgent(passwordOverride)`의 첫 번째 인자로 전달됐다.
- `passwordOverride` 위치에 클릭 이벤트 객체가 들어가면서 IPC 요청의 `password` 필드에 복제 불가능한 객체가 섞였다.
- Electron은 IPC 요청을 보낼 때 이 객체를 구조화 복제할 수 없어 `An object could not be cloned.`를 표시했다.

## 해결

- 서버 등록 패널의 버튼 핸들러를 `onClick={() => onPrepareAgent()}` 형태로 변경했다.
- 다른 액션 버튼도 동일하게 인자 없는 래퍼로 호출하도록 맞췄다.
- `handlePrepareAgent`는 문자열 인자가 아닐 경우 무시하고 폼의 SSH password를 사용하도록 방어 코드를 추가했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

- 두 명령 모두 통과했다.
