# 원격 게임 서버 오픈 / 점프 접속

## 목표

개인 서버가 공유기 뒤 내부망에 있어도, 사용자가 웹 UI에서 클릭만으로 게임 서버를 외부에 공개할 수 있게 한다.

## 네트워크 유형

### A. 직접 외부 오픈

사용자가 공인 IP 또는 포트포워딩 가능한 환경일 때 사용한다.

```text
사용자 PC -> 공유기 포트포워딩 -> 개인 서버 Agent -> Docker 게임 서버
```

필요 기능:

- 포트 자동 감지
- 사용 가능 포트 추천
- 방화벽/UFW 설정 가이드
- Docker 포트 매핑 자동 생성

### B. 점프 서버 방식

사용자 서버가 내부망에 있고 외부에서 직접 접근이 어려울 때 사용한다.

```text
게임 클라이언트
-> 플랫폼 중계 서버
-> 사용자 서버 Agent
-> Docker 게임 서버
```

예시:

```text
외부 사용자 -> relay.example.com:30001 -> 내부 서버:25565
```

필요 구성:

- 중앙 Relay/Jump 서버
- Agent의 outbound 연결
- TCP 터널링
- 포트 매핑 테이블

### C. 내부망 점프 방식

외부망에 노출된 서버 1대가 있고, 실제 게임 서버는 내부망 서버에 있을 때 사용한다.

```text
외부망 서버 -> 내부망 서버 -> Docker 게임 서버
```

예시:

```text
Public Server: {relayPrivateIp}
Internal Server: {internalServerIp}
```

흐름:

1. 외부 사용자는 Public Server의 포트로 접속한다.
2. Public Server의 Nginx stream 또는 FRP가 내부 서버로 전달한다.
3. 내부 서버에서 게임 컨테이너가 응답한다.

## 추천 구현 방식

### 1순위: Agent + FRP 방식

FRP는 NAT/방화벽 뒤의 로컬 서버를 외부에 노출하기 위한 reverse proxy 도구이며 TCP/UDP를 지원한다. 게임 서버와 궁합이 좋다.

구조:

- 중앙 서버: `frps`
- 사용자 서버 Agent: `frpc` 제어
- 게임 서버: Docker container

예시: 사용자 서버에서 Minecraft 실행

- 내부 포트: `25565`
- 외부 공개 포트: `relay.example.com:31001`

예상 동작:

```text
Minecraft Client
-> relay.example.com:31001
-> frps
-> frpc outbound tunnel
-> Agent host
-> Docker container:25565
```

구현 포인트:

- 플랫폼에서 외부 공개 포트 할당
- Agent가 게임 서버별 `frpc` 설정 생성
- Agent가 `frpc` 프로세스 또는 컨테이너 생명주기 관리
- 게임 서버 종료 시 포트 매핑 회수
- TCP/UDP 지원 여부를 게임 템플릿에 명시

### 2순위: Nginx Stream 방식

이미 외부망 서버와 내부망 서버가 있는 사용자를 위한 방식이다.

구조:

```nginx
stream {
    server {
        listen 31001;
        proxy_pass {internalServerIp}:25565;
    }
}
```

구현 포인트:

- 웹 UI에서 외부망 서버와 내부망 서버 정보를 입력받는다.
- Nginx stream 설정 예시를 자동 생성한다.
- 적용 전 포트 충돌 여부를 점검한다.
- 설정 적용 후 연결 테스트를 제공한다.

## 기능 체크리스트

- [ ] 네트워크 유형 선택 UI 제공
- [ ] 직접 외부 오픈 포트 감지 및 추천
- [ ] Docker 포트 매핑 자동 생성
- [ ] Relay/Jump 서버 포트 할당
- [ ] Agent outbound 터널 연결
- [ ] TCP 터널링 지원
- [ ] UDP 터널링 지원 여부 검토
- [ ] 포트 매핑 테이블 저장
- [ ] 게임 서버 종료 시 매핑 정리
- [ ] Nginx stream 설정 생성
- [ ] 연결 테스트 및 상태 표시

## 우선순위

1. Agent + FRP 방식으로 기본 점프 접속을 구현한다.
2. 직접 외부 오픈은 포트포워딩 가능한 사용자를 위한 보조 경로로 제공한다.
3. 내부망 점프 방식은 고급 사용자 또는 온프레미스 구성을 위한 옵션으로 제공한다.

