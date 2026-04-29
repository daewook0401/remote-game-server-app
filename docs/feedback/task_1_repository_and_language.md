# task_1 피드백: Git 레포와 개발 언어 명시

## 받은 피드백

실제 시작 프로젝트의 Git 레포는 `https://github.com/daewook0401/OpenServerHub.git`이며, 레포를 연결하고 어떤 언어로 개발할 것인지 명시해야 한다.

## 반영 내용

- 현재 작업 폴더를 Git 저장소로 초기화했다.
- 기본 브랜치를 `main`으로 설정했다.
- 원격 저장소 `origin`을 `https://github.com/daewook0401/OpenServerHub.git`로 연결했다.
- `docs/plans/task_1_impl.md`에 개발 언어 기준을 추가했다.

## 개발 언어 기준

- 설치형 프로그램 UI: TypeScript
- 설치형 프로그램 UI 프레임워크: Electron + React
- 설치형 프로그램 내부 제어 계층: TypeScript
- Agent: Go
- Relay/Jump 서버 제어 API: Go
- FRP 터널 처리: `frps`, `frpc` 외부 바이너리 사용
- 데이터 저장소 쿼리: SQL
- 컨테이너 실행 설정: Dockerfile, Docker Compose YAML
- 설정 파일: JSON 또는 TOML
- 문서와 사용자 안내 가이드: Markdown, 한국어

## 남은 확인 사항

- 데이터베이스 종류
- 패키징 도구
- 지원 운영체제 범위
- Electron 자동 업데이트 방식
- 클라우드 배포 방식

