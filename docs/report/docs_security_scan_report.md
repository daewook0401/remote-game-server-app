# docs 보안 민감 정보 스캔 보고서

## 스캔 범위

- 대상: `docs/**/*.md`
- 목적: Agent 보안에 영향을 줄 수 있는 문서 내 민감 정보 노출 여부 확인
- 확인 기준:
  - 실제 토큰, 비밀번호, private key
  - Agent URL, Agent 포트, 인증 헤더 예시
  - 실제 도메인, SSH 포트, 사용자명
  - 내부망 IP, 네트워크 구조
  - HAProxy/방화벽/Agent 운영 방식 노출

## 요약 결론

현재 `docs/` 문서에서 실제 Agent 토큰, SSH 비밀번호, private key 원문은 발견되지 않았다.

스캔 과정에서 공개 저장소 기준으로 정리해야 할 내부망 IP와 예시 토큰 표현이 발견되었고, 현재 문서에서는 placeholder로 치환했다.

## 발견 사항

### 1. 실제 환경으로 보이는 내부망 IP 노출

위험도: 중간, 조치 완료

다음 문서에 실제 내부망 IP가 있었고, 현재는 `{internalServerIp}` 또는 `{relayPrivateIp}`로 치환했다.

- `docs/guides/nginx-stream-guide.md`
  - `proxy_pass {internalServerIp}:25565;`
- `docs/tech/remote-agent-registration-flow.md`
  - `Internal Agent: http://{internalServerIp}:18080`
- `docs/troubleshooting/task_3_agent_api_fetch_blocked.md`
  - HAProxy route가 내부 서버 `{internalServerIp}:18080`으로 연결하지 못할 수 있다는 설명
- `docs/remote-game-server-access.md`
  - `Internal Server: {internalServerIp}`
  - `proxy_pass {internalServerIp}:25565;`

`docs/remote-game-server-access.md`에 있던 경유 서버 사설 IP도 `{relayPrivateIp}`로 치환했다.

권장 판단:
- 내부망 구조 설명은 남기되 실제 대역처럼 보이는 값은 계속 placeholder로 유지한다.

### 2. Agent 관리 포트와 공개 바인딩 방식 노출

위험도: 낮음에서 중간

여러 문서에서 다음 구조가 반복적으로 등장한다.

- `18080/tcp`
- `AGENT_ADDR=0.0.0.0:18080`
- `http://127.0.0.1:18080`
- HAProxy `bind 0.0.0.0:<proxy_port>`

이 내용은 제품 동작과 보안 설계 설명에 필요한 정보라서 자체로 비밀은 아니다. 오히려 `0.0.0.0:18080`이 위험하다는 경고와 토큰 필수 조건이 같이 문서화되어 있다.

권장 판단:
- README와 공개 가이드에서는 `18080`을 기본값으로 언급해도 된다.
- 트러블슈팅/작업 기록에 있는 실제 서버 IP와 결합된 `{internalServerIp}:18080`만 정리하는 것이 우선이다.

### 3. 토큰/비밀번호 예시 문자열

위험도: 낮음, 조치 완료

다음 예시 문자열은 placeholder로 정리했다.

- `docs/tech/agent-docker-control.md`
  - `$env:AGENT_TOKEN="<example-agent-token>"`
  - `Authorization: Bearer <example-agent-token>`
- `docs/tech/linux-agent-distribution.md`
  - `AGENT_TOKEN=<example-agent-token>`

현재 값은 명백한 placeholder이며 실제 비밀값으로 보이지 않는다.

권장 판단:
- 그대로 두어도 치명적이지 않다.
- 이후에도 실제 토큰 형식으로 보이는 값을 문서에 남기지 않는다.

### 4. 실제 SSH 비밀번호, Agent 토큰, private key 원문

위험도: 발견 없음

다음 항목은 발견되지 않았다.

- 실제 SSH password 값
- 실제 Agent token 값으로 보이는 긴 난수/문자열
- private key PEM 원문
- SSH public/private key 원문
- 실제 운영 도메인
- 실제 SSH 포트
- 실제 SSH 사용자명

## Agent 보안 영향 평가

문서만으로 Agent가 직접 위험해지는 상태는 아니다.

직접 위험이 되려면 다음 정보가 함께 노출되어야 한다.

- 실제 외부 접근 가능한 Agent URL
- 실제 Agent token
- 방화벽에서 전체 공개된 `18080/tcp`
- SSH 접속 정보 또는 private key

이번 스캔에서는 이 조합이 발견되지 않았다.

내부망 IP와 포트가 문서에 남아 있으면 공개 레포 기준으로 공격 표면을 추정하는 힌트가 될 수 있다. 이번 조치에서는 실제 운영망으로 보이는 값은 placeholder로 치환했다.

## 수정 우선순위 제안

1. 실제 내부망 IP는 `{internalServerIp}`, `{relayPrivateIp}` 같은 placeholder로 유지
2. 예시 토큰은 `<example-agent-token>` placeholder로 유지
3. 공개 문서에서 `0.0.0.0:18080`은 위험 예시임을 유지하되, 권장값은 `127.0.0.1:18080` 또는 HAProxy + 허용 IP 제한으로 명확히 표기
4. 추후 실제 운영 테스트 로그를 문서화할 때 도메인, SSH 포트, 사용자명, 내부 IP를 작성하지 않는 규칙 추가

## 최종 판단

- 즉시 삭제가 필요한 실제 비밀값: 발견 없음
- 공개 레포 기준 정리 권장 정보: 발견된 내부망 IP와 예시 토큰 표현은 조치 완료
- Agent 보안 직접 위협 여부: 현재 문서만으로는 낮음
