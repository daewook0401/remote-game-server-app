# task_1 트러블슈팅: 개발 UI 흰 화면

## 증상

개발 서버 `http://127.0.0.1:5173`에 접속하면 HTML은 응답하지만 화면에는 흰색 화면만 보인다.

## 재현 방법

```powershell
cd C:\develop\side-project\game_saas\apps\desktop
npm run dev -- --port 5173
```

브라우저에서 다음 주소를 연다.

```text
http://127.0.0.1:5173
```

## 시도한 방법

- `Invoke-WebRequest`로 HTML 응답 확인
- `npm run desktop:typecheck` 실행
- 개발 서버 포트 점유 프로세스 확인

## 실패한 접근

- HTTP 200과 typecheck 성공만으로 UI 렌더링이 정상이라고 판단하면 안 된다.

## 최종 원인

`index.html`이 `/src/App.tsx`를 직접 로드하고 있었다. `App.tsx`는 React 컴포넌트를 export만 하고 `createRoot(...).render(...)`를 호출하지 않으므로 `#root`가 비어 있었다.

## 해결 방법

- `apps/desktop/src/main.tsx`를 추가한다.
- `main.tsx`에서 `createRoot(root).render(<App />)`를 호출한다.
- `index.html`의 script entry를 `/src/main.tsx`로 바꾼다.

## 재발 방지 규칙

- React 앱은 `index.html -> main.tsx -> App.tsx` 진입 구조를 사용한다.
- HTTP 200, typecheck, build 성공과 실제 렌더링 성공을 같은 것으로 보지 않는다.

