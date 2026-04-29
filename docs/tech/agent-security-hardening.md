# Agent 보안 조치안

## 배경

OpenServerHub Agent는 Docker 컨테이너 목록 조회, 게임 서버 생성, 컨테이너 시작/중지/삭제, 콘솔 로그 조회, 콘솔 명령 전송을 수행한다.

따라서 Agent API 포트 `18080`은 일반 게임 접속 포트가 아니라 서버 관리 포트다. 이 포트가 인터넷에 노출되면 게임 서버뿐 아니라 Docker 제어 권한이 함께 노출될 수 있다.

## 현재 확인된 구조

### Agent 기본 실행

`services/agent/cmd/agent/main.go` 기준으로 `AGENT_ADDR`이 비어 있으면 Agent는 아래 주소로 실행된다.

```text
127.0.0.1:18080
```

이 기본값은 같은 서버 내부에서만 접근 가능하므로 상대적으로 안전하다.

### 원격 자동 설치 스크립트

`apps/desktop/electron/ssh/bootstrapScripts.ts` 기준으로 원격 자동 설치 시 `.env`에 아래 값이 기록된다.

```text
AGENT_ADDR=0.0.0.0:18080
```

이 설정은 서버의 모든 네트워크 인터페이스에서 Agent API를 수신한다. 방화벽, 보안 그룹, 라우터 정책에서 `18080`이 열려 있으면 외부 네트워크에서 접근 가능하다.

### 인증 토큰

Agent는 `AGENT_TOKEN`이 설정된 경우 `/docker/*` API에 Bearer 토큰을 요구한다.

```text
Authorization: Bearer <AGENT_TOKEN>
```

하지만 `AGENT_TOKEN`이 비어 있으면 `/docker/*` API도 인증 없이 동작한다. `/healthz`는 상태 확인 용도라 토큰 없이 접근 가능하다.

## 위험 시나리오

### 1. `0.0.0.0:18080` + 토큰 없음

가장 위험하다.

외부에서 Agent API에 접근할 수 있으면 인증 없이 다음 작업이 가능해질 수 있다.

- Docker 컨테이너 목록 조회
- 게임 서버 컨테이너 생성
- 컨테이너 시작/중지/삭제
- 콘솔 로그 조회
- 콘솔 명령 전송

### 2. `0.0.0.0:18080` + 토큰 있음

토큰이 없는 것보다는 안전하지만 충분하지 않다.

현재 Agent API는 HTTP 기반이므로 네트워크 경로가 안전하지 않으면 토큰이 평문으로 지나갈 수 있다. 또한 토큰 유출, 브루트포스, 잘못된 방화벽 설정 위험이 남는다.

### 3. `127.0.0.1:18080` + SSH 터널

권장 구조다.

Agent는 서버 내부 루프백에서만 실행하고, Desktop 앱이 SSH 터널을 통해 접근한다.

```text
Desktop 127.0.0.1:<local-port>
  -> SSH tunnel
  -> Server 127.0.0.1:18080
```

이 구조에서는 서버의 `18080` 포트를 외부에 열 필요가 없다.

## 권장 보안 원칙

1. Agent API 포트는 기본적으로 외부 공개하지 않는다.
2. 원격/클라우드 서버 Agent는 토큰 없는 구성을 허용하지 않는다.
3. 원격 접근은 SSH 터널을 기본 경로로 둔다.
4. 불가피하게 직접 공개해야 하면 방화벽에서 허용 IP를 제한한다.
5. Agent 포트와 게임 서버 포트를 UI와 문서에서 명확히 구분한다.
6. `AGENT_TOKEN`은 충분히 긴 난수로 생성하고 저장/표시를 최소화한다.

## 제품 조치안

### 1단계: 즉시 반영 권장

task_2 범위 안에서 반영할 수 있는 최소 조치다.

- 원격/클라우드 서버 등록 또는 Agent 설치 시 사용자가 토큰을 직접 입력하지 않아도 앱이 강한 토큰을 자동 생성한다.
- 자동 생성한 토큰을 SSH 설치 스크립트의 `AGENT_TOKEN`에 적용하고, 같은 값을 로컬 서버 저장 정보에 저장한다.
- UI에는 토큰 원문을 기본 노출하지 않고 `Agent 인증 설정됨`처럼 상태만 표시한다.
- 원격/클라우드 자동 설치에서 토큰 없는 진행을 차단한다.
- 서버 상세 화면에서 Agent URL이 `http://공인IP:18080` 형태이고 토큰이 비어 있으면 보안 경고를 표시한다.
- `외부 공개`라는 표현을 Agent 관리 포트에는 사용하지 않는다.

승인 기준:

- 토큰 없는 원격 Agent 설치가 UI에서 진행되지 않는다.
- 사용자가 토큰을 몰라도 앱이 생성, 서버 적용, 로컬 저장, 요청 헤더 첨부를 자동 처리한다.
- 기존 로컬 개발 환경 `127.0.0.1:18080`은 막지 않는다.
- 이미 등록된 위험 구성은 서버 상세에서 경고한다.

### 2단계: 기본 설치값 변경

Agent 자동 설치 기본값을 아래처럼 바꾼다.

```text
AGENT_ADDR=127.0.0.1:18080
```

이 변경 후 Desktop 앱은 원격 서버에 직접 `http://서버IP:18080`로 접근하지 않고 SSH 터널을 통해 접근해야 한다.

승인 기준:

- 원격 서버의 `18080` 포트가 외부에서 닫혀 있어도 Desktop 앱이 Agent에 접근할 수 있다.
- SSH 인증 정보가 있는 서버에서 터널 생성/해제 흐름이 동작한다.
- 서버 목록에는 사용자가 이해할 수 있도록 `터널 연결됨`, `터널 필요`, `Agent 접근 불가` 상태가 표시된다.

### 3단계: SSH 터널 기반 접속

Desktop 앱에서 서버 선택 시 SSH 터널을 열고, Agent API 요청은 로컬 터널 주소로 보낸다.

예시:

```text
원격 Agent 실제 주소: 127.0.0.1:18080
Desktop 접근 주소: http://127.0.0.1:<allocated-local-port>
```

구현 방향:

- 서버 상세 진입 시 SSH 터널을 준비한다.
- 터널 준비 후 Agent 상태 확인을 자동 실행한다.
- 서버 상세를 벗어나거나 앱 종료 시 터널을 정리한다.
- 포트 충돌을 피하기 위해 로컬 포트는 동적으로 할당한다.

승인 기준:

- 사용자가 원격 서버의 `18080` 포트를 열지 않아도 서버 상세 상태 확인이 가능하다.
- 콘솔, 컨테이너 목록, 컨테이너 작업이 터널 주소를 통해 동작한다.
- 터널 실패 시 원인을 UI에 표시한다.

### 3-1단계: 점프 서버 경유 접속

사용자 환경에 외부망 접근 서버와 내부망 게임 서버가 분리되어 있고, 내부망 서버는 점프 서버를 통해서만 접근해야 할 수 있다.

이 경우 서버 등록 화면에는 접속 경로 옵션이 필요하다.

```text
접속 경로
1. 직접 SSH 연결
2. 점프 서버 경유
3. 직접 공개 예외
```

점프 서버 경유 구성은 다음과 같다.

```text
Desktop
  -> SSH: Jump Server(외부망)
  -> SSH: Target Game Server(내부망)
  -> Target 127.0.0.1:18080
```

Agent API 요청은 최종적으로 Desktop의 로컬 터널 주소를 사용한다.

```text
Desktop http://127.0.0.1:<local-port>
  -> SSH tunnel through Jump Server
  -> Target Game Server 127.0.0.1:18080
```

서버 등록 정보에는 최소 다음 값이 필요하다.

```text
connectionMode: directSsh | jumpSsh | directPublic

target sshHost
target sshPort
target sshUser
target sshAuthMethod
target sshKeyPath

jump sshHost
jump sshPort
jump sshUser
jump sshAuthMethod
jump sshKeyPath
```

password 인증은 매번 입력을 요구할 수 있으므로, 점프 서버 경유 모드는 SSH key 인증을 우선 권장한다.

승인 기준:

- 서버 등록 시 점프 서버 정보를 별도로 입력할 수 있다.
- 내부망 대상 서버의 Agent 포트 `18080`은 외부에 열지 않아도 된다.
- Desktop 앱은 점프 서버를 통해 대상 서버에 SSH 명령을 실행할 수 있다.
- Agent 설치, 상태 확인, 콘솔, 서버 삭제 정리 명령이 같은 접속 경로를 사용한다.
- Agent 포트 설정 명령은 점프 서버가 아니라 Target Game Server에서 실행한다.
- UI에서 `127.0.0.1` Agent 주소가 로컬 Agent인지, SSH 터널인지, 점프 서버 경유 터널인지 구분해 표시한다.

### 4단계: 직접 공개 예외 모드

SSH 터널을 사용할 수 없는 환경을 위해 직접 공개 모드를 예외적으로 남길 수 있다.

직접 공개 모드 요구사항:

- `AGENT_TOKEN` 필수
- UI에서 위험 안내 확인 필수
- 방화벽 허용 IP 입력 또는 확인 필수
- 문서에 클라우드 보안 그룹, UFW, 라우터 포트포워딩 제한 안내 제공

승인 기준:

- 사용자가 직접 공개 모드를 명시적으로 선택해야 한다.
- 토큰 없이 직접 공개 모드를 저장할 수 없다.
- 경고 문구가 게임 포트 공개와 Agent 관리 포트 공개를 구분한다.

## 운영자 수동 조치 가이드

이미 테스트 서버에 Agent를 설치했고 `18080`을 열어둔 경우 다음 순서로 조치한다.

### 1. Agent 바인딩 확인

서버에서 실행한다.

```bash
sudo cat /opt/remote-game-agent/.env
```

아래 값이면 외부 수신 가능 상태다.

```text
AGENT_ADDR=0.0.0.0:18080
```

### 2. 토큰 확인

`.env`에서 `AGENT_TOKEN`이 비어 있으면 위험하다.

```text
AGENT_TOKEN=
```

토큰은 임시로라도 긴 난수로 설정한다.

```bash
openssl rand -hex 32
```

### 3. 외부 공개 중단

SSH 터널을 쓸 예정이면 아래처럼 변경한다.

```text
AGENT_ADDR=127.0.0.1:18080
```

서비스를 재시작한다.

```bash
sudo systemctl restart remote-game-agent
```

### 4. 방화벽 닫기

UFW를 쓰는 경우:

```bash
sudo ufw delete allow 18080/tcp
```

클라우드 서버라면 보안 그룹 또는 방화벽 규칙에서 `18080/tcp` 인바운드를 제거한다.

### 5. 임시로 직접 접근해야 하는 경우

내 PC 공인 IP만 허용한다.

```bash
sudo ufw allow from <내_PC_IP> to any port 18080 proto tcp
```

이 경우에도 `AGENT_TOKEN`은 필수다.

## task_2 반영 권장 범위

이번 서버 선택/콘솔 UX 작업에 함께 넣을 범위는 다음이 적절하다.

- 원격/클라우드 Agent token 자동 생성 및 자동 적용
- 원격/클라우드 Agent token 빈 값 차단 또는 강한 경고
- 위험 Agent URL 감지 경고
- 서버 상세 자동 상태 확인 전에 위험 구성을 사용자에게 알려주는 UI
- 서버 삭제 시 원격 Agent 정리 여부를 확인하고, 승인된 경우 원격 Agent 서비스, `18080/tcp` 방화벽 허용 규칙, Agent 데이터 삭제 후 로컬 등록 정보를 삭제하는 흐름
- 문서와 피드백 기록

이번 작업에서 바로 넣지 않고 별도 task로 분리할 범위는 다음이다.

- Agent 자동 설치 기본값을 `127.0.0.1:18080`로 변경
- SSH 터널 생성/관리
- 점프 서버 경유 SSH 터널 생성/관리
- 직접 공개 예외 모드 설계
- 기존 서버 저장 데이터 마이그레이션

## 서버 삭제 시 Agent 정리 정책

서버 삭제는 단순히 앱의 저장 목록에서 서버를 제거하는 작업이 아니라, 원격 서버에 설치된 Agent와 Agent 데이터 정리 여부를 함께 결정해야 한다.

### 삭제 옵션

서버 삭제 모달에서 최소 두 가지 선택지를 제공한다.

```text
1. 앱 등록 정보만 삭제
2. 원격 Agent와 데이터까지 삭제
```

기본값은 안전하게 `앱 등록 정보만 삭제`로 두되, 보안 권장 흐름은 `원격 Agent와 데이터까지 삭제`다.

### 원격 Agent와 데이터까지 삭제 순서

권장 순서는 다음과 같다.

```text
1. 사용자에게 삭제 범위 확인
2. SSH 인증 정보 확인
3. 원격 Agent 서비스 중지
4. systemd 서비스 비활성화 및 서비스 파일 삭제
5. Agent 프로세스 잔여 종료
6. Agent 관리 포트 18080/tcp 방화벽 허용 규칙 삭제
7. /opt/remote-game-agent 디렉터리 삭제
8. 로컬 앱의 서버 등록 정보 삭제
```

중요한 점은 로컬 등록 정보를 먼저 지우지 않는 것이다. 원격 정리 전에 로컬 정보를 삭제하면 SSH 접속 정보와 Agent 식별 정보를 잃어 원격 정리가 어려워질 수 있다.

### 삭제 대상

원격 정리 시 삭제 대상은 다음이다.

```text
/etc/systemd/system/remote-game-agent.service
/opt/remote-game-agent/agent
/opt/remote-game-agent/.env
/opt/remote-game-agent/data
/opt/remote-game-agent
```

단, 게임 서버 컨테이너와 게임 데이터 볼륨은 별도 확인 없이 함께 삭제하지 않는다. Agent 삭제와 게임 서버 삭제는 위험 범위가 다르다.

### 18080 방화벽 규칙 삭제

Agent를 삭제할 때는 `18080/tcp` 허용 규칙도 함께 닫는다. 이 포트는 Agent 관리 API 포트이므로 Agent가 사라진 뒤에도 열어둘 이유가 없다.

서버 내부 방화벽 도구별 권장 처리는 다음과 같다.

```bash
# UFW
sudo ufw delete allow 18080/tcp
```

```bash
# firewalld
sudo firewall-cmd --permanent --remove-port=18080/tcp
sudo firewall-cmd --reload
```

클라우드 보안 그룹, 호스팅 방화벽, 공유기 포트포워딩은 서버 내부 명령만으로 닫을 수 없을 수 있다. 이 경우 UI에서 `클라우드/공유기 방화벽의 18080 규칙도 제거하세요` 안내를 남긴다.

### 실패 처리

원격 Agent 삭제가 실패하면 로컬 등록 정보 삭제를 바로 진행하지 않는다.

UI는 다음 선택지를 제공한다.

```text
원격 정리 실패
- 다시 시도
- 앱 등록 정보만 삭제
- 취소
```

사용자가 `앱 등록 정보만 삭제`를 명시적으로 선택한 경우에만 로컬 정보를 삭제한다.

### 로컬 서버 삭제

로컬 서버는 SSH 정리 대상이 아니므로 다음만 수행한다.

```text
1. 로컬 Agent가 이 앱이 설치한 Agent인지 확인
2. 정리 가능한 경우 서비스 중지 및 데이터 삭제
3. 앱 등록 정보 삭제
```

현재 MVP에서는 로컬 Agent 자동 설치/소유권 판단이 불명확하면 앱 등록 정보 삭제만 수행하고, Agent 정리는 별도 안내로 둔다.

## 승인 요청안

권장 승인안은 다음과 같다.

```text
task_2에는 Agent token 자동 생성/적용, 토큰 빈 값 차단/경고, 위험 URL 경고를 포함한다.
서버 삭제 시 원격 Agent, 18080 방화벽 규칙, Agent 데이터 삭제 옵션을 추가하고, 원격 정리 후 로컬 등록 정보를 삭제한다.
SSH 터널 기반 Agent 접속 구조는 별도 task로 계획서를 작성한다.
점프 서버 경유 접속 옵션은 SSH 터널 task에 포함하거나 별도 하위 단계로 계획한다.
원격 Agent 자동 설치 기본값 변경은 SSH 터널 task에서 함께 처리한다.
```

이 방식은 현재 UX 변경 작업을 지나치게 키우지 않으면서, 가장 위험한 토큰 없는 외부 공개 구성을 먼저 막는다.
## iptables DNAT 포트 중계 예외

`iptables DNAT`는 점프 서버가 외부에서 받은 포트를 내부 Target Game Server로 넘겨주는 방식이다.

예시 흐름:

```text
Client
  -> Jump Server public-ip:external-port
  -> DNAT
  -> Target Game Server private-ip:target-port
```

이 방식은 게임 서버 접속 포트를 공개해야 할 때 유용할 수 있다. 하지만 Agent API `18080`은 Docker 제어 권한과 연결되는 관리 포트이므로 기본 관리 경로로 DNAT를 쓰지 않는다.

Agent 관리 API 권장 순서는 다음과 같다.

```text
1. SSH 터널
2. 점프 서버 경유 SSH 터널
3. 직접 공개 예외
4. DNAT 직접 공개 예외
```

Agent `18080`에 DNAT를 허용해야 하는 예외 상황에서는 다음 조건을 모두 만족해야 한다.

- `AGENT_TOKEN` 필수
- 허용 IP 또는 허용 사설망 대역 제한 필수
- 전체 공개 `0.0.0.0/0` 금지
- DNAT 규칙과 FORWARD 허용 규칙을 서버 등록 정보에 추적
- 서버 삭제 시 DNAT 규칙, FORWARD 규칙, 18080 방화벽 규칙을 함께 제거
- 제거 실패 시 로컬 등록 정보 삭제 전 사용자에게 실패 내용을 보여줌

따라서 DNAT는 “Agent 접근 편의 기능”이 아니라 “포트 공개 정책”으로 다뤄야 한다. 게임 서버 포트에는 실용적인 선택지지만, Agent 포트에는 보안 예외로만 적용한다.

## Agent 18080 TCP proxy 중계 예외

Agent `18080`을 점프 서버에서 중계해야 한다면 DNAT보다 TCP proxy 방식이 더 관리하기 쉽다.

TCP proxy 흐름:

```text
Desktop or allowed client
  -> Jump Server proxy listen port
  -> TCP proxy process
  -> Target Game Server Agent 127.0.0.1:18080 or internal-ip:18080
```

DNAT는 커널 NAT 규칙 중심이라 앱에서 “지금 어떤 서버의 어떤 Agent를 위해 열려 있는지”를 추적하기가 상대적으로 어렵다. 반면 TCP proxy는 systemd 서비스 단위로 만들 수 있어 상태 확인, 로그 확인, 중지, 삭제를 제품 플로우에 넣기 쉽다.

권장 우선순위는 다음과 같이 조정한다.

```text
1. SSH 터널
2. 점프 서버 경유 SSH 터널
3. Agent TCP proxy 예외
4. Agent DNAT 직접 공개 예외
5. Agent 직접 공개
```

TCP proxy를 허용하려면 다음 조건이 필요하다.

- `AGENT_TOKEN` 필수
- 허용 IP 또는 CIDR 제한 필수
- proxy 서비스 이름과 설정 파일 경로 추적
- proxy 수신 포트와 Target Agent 포트 분리 권장
- proxy 수신 방화벽 규칙 생성/삭제 자동화
- 서버 삭제 시 proxy 서비스 중지/삭제 후 Agent 정리

구현 후보:

```text
socat        : 단순 TCP 중계에 적합
nginx stream : 운영 설정, 로그, allow/deny 구성에 적합
haproxy      : 상태 확인과 장기 운영에 적합
```

MVP에서는 Agent 관리 포트와 게임 서버 TCP 포트를 같은 방식으로 관리할 수 있는 HAProxy를 우선 후보로 둔다. 허용 IP 제한은 HAProxy ACL 또는 방화벽 규칙 중 최소 한 곳에서 반드시 강제한다.

### HAProxy TCP proxy 권장 구현

Agent `18080` proxy의 기본 권장 구현은 `Jump Server 내부 SSH tunnel + HAProxy TCP proxy`다.

이 방식은 Target Game Server의 Agent를 계속 `127.0.0.1:18080`에 묶어둘 수 있다.

```text
외부 허용 클라이언트
  -> Jump Server:<proxy-port>
  -> HAProxy frontend/backend
  -> Jump Server 127.0.0.1:<tunnel-local-port>
  -> ssh -L
  -> Target Game Server 127.0.0.1:18080
```

Jump Server에는 서버별 SSH tunnel systemd 서비스와 공용 HAProxy 서비스가 생긴다.

```text
remote-game-agent-proxy-{serverId}-tunnel.service
haproxy.service
```

터널 서비스는 Jump Server에서 Target Game Server로 SSH local forwarding을 유지한다.

```bash
ssh -N \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L 127.0.0.1:<tunnel_local_port>:127.0.0.1:18080 \
  <target_user>@<target_host> -p <target_port>
```

HAProxy는 외부 수신 포트를 로컬 터널 포트로 넘긴다.

```haproxy
frontend rg_agent_<server_id>
    bind 0.0.0.0:<proxy_port>
    mode tcp
    tcp-request connection reject if !{ src <allowed_cidr> }
    default_backend rg_agent_<server_id>_backend

backend rg_agent_<server_id>_backend
    mode tcp
    option tcp-check
    server target_agent 127.0.0.1:<tunnel_local_port> check
```

방화벽은 반드시 허용 IP 기반으로 연다.

```bash
sudo ufw allow from <allowed_cidr> to any port <proxy_port> proto tcp
```

삭제 시에는 HAProxy 설정에서 해당 frontend/backend를 제거하고 reload한 뒤, 터널 서비스를 내린다.

```bash
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl reload haproxy

sudo systemctl disable --now remote-game-agent-proxy-{serverId}-tunnel.service
sudo rm -f /etc/systemd/system/remote-game-agent-proxy-{serverId}-tunnel.service

sudo systemctl daemon-reload
sudo ufw delete allow from <allowed_cidr> to any port <proxy_port> proto tcp
```

이 방식의 장점:

- Target Agent를 외부 또는 내부망 전체에 열 필요가 없다.
- Jump Server에서 HAProxy 상태와 로그를 확인할 수 있다.
- 앱이 proxy 생성/상태/삭제를 서버 수명주기에 묶어 관리할 수 있다.
- DNAT보다 어떤 서버를 위해 열린 중계인지 추적하기 쉽다.
- Agent 관리 포트와 게임 서버 TCP 포트를 같은 HAProxy 설정 모델로 관리할 수 있다.

주의점:

- Jump Server에서 Target Game Server로 비밀번호 없는 SSH 연결 또는 앱이 준비한 키 기반 연결이 필요하다.
- proxy 포트는 Agent 기본 포트 `18080`과 분리된 임의 포트를 우선 사용한다.
- `AGENT_TOKEN`과 허용 IP 제한이 없으면 proxy 생성을 차단한다.
- proxy health check는 `/healthz`만으로 끝내지 않고, 토큰이 필요한 API까지 확인한다.
- TCP/UDP 경유는 모두 외부망 경유 노드의 HAProxy로 통일한다. 단, UDP는 HAProxy UDP 지원 설치본 또는 UDP 모듈이 확인된 경우에만 허용한다.

## 외부망 경유 노드 HAProxy 정책

외부망과 내부망을 동시에 볼 수 있는 노트북 또는 점프 노드가 있을 경우, 포트 경유 기능은 해당 노드에 설치된 HAProxy가 담당한다.

```text
External Client
  -> External Network Laptop / Jump Node HAProxy
  -> Internal Network Target Game Server
```

정책:

- TCP/UDP 경유는 모두 HAProxy 설정으로 생성한다.
- DNAT/iptables 직접 중계는 기본 경로에서 제외한다.
- Agent `18080`은 TCP frontend/backend로 구성한다.
- 게임 TCP 포트는 TCP frontend/backend로 구성한다.
- 게임 UDP 포트는 UDP 지원 HAProxy 설치본에서만 구성한다.
- UDP 지원 확인 실패 시 UDP 경유 등록을 차단한다.
- HAProxy 설정은 앱이 만든 서버별 블록으로 추적한다.
- 설정 변경 전 `haproxy -c` 검증을 통과해야 reload한다.

경유 노드에 필요한 조건:

- HAProxy 설치 가능
- 외부 클라이언트가 접근 가능한 IP/포트 보유
- 내부망 Target Game Server 접근 가능
- TCP/UDP 방화벽 규칙 생성/삭제 가능
- UDP 사용 시 HAProxy UDP 지원 확인 가능

등록 시 확인 순서:

```text
1. 경유 노드 SSH 확인
2. HAProxy 설치 확인
3. UDP 필요 시 HAProxy UDP 지원 확인
4. Target Game Server SSH 확인
5. Agent 설치/토큰/포트 설정
6. HAProxy 설정 생성
7. haproxy -c 검증
8. HAProxy reload
9. Agent 또는 게임 포트 연결 확인
10. 서버 등록
```

삭제 시 정리 순서:

```text
1. HAProxy 서버별 frontend/backend 제거
2. haproxy -c 검증
3. HAProxy reload
4. 경유 노드 TCP/UDP 방화벽 규칙 제거
5. Target Game Server Agent 정리
6. 로컬 등록 정보 삭제
```

UDP 주의점:

HAProxy의 일반 TCP 설정만으로 UDP 포트를 처리할 수 없다. UDP 경유를 요구하는 게임은 HAProxy UDP 기능이 포함된 설치본인지 먼저 확인해야 한다. 확인되지 않으면 앱은 UDP 경유 설정을 생성하지 않는다.
