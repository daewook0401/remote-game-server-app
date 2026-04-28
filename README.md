# Remote Game Server App

설치형 프로그램에서 개인 게임 서버를 외부에 공개하고, NAT 환경에서는 FRP 기반 점프 접속을 제공하기 위한 프로젝트다.

## 초기 기술 기준

- Desktop UI: TypeScript, Electron, React
- Agent: Go
- Relay API: Go
- Tunnel: FRP(`frps`, `frpc`)
- Container: Docker, Docker Compose
- Docs: Markdown, Korean

## 프로젝트 구조

```text
apps/
  desktop/      Electron + React 설치형 프로그램
services/
  agent/        사용자 서버에서 실행되는 Agent
  relay/        중앙 Relay/Jump 서버 제어 API
docs/
  guides/       사용자 안내 가이드
```

