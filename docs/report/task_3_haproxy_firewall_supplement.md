# task_3 추가 보고: HAProxy 중계 서버 방화벽 개방

## 배경

HAProxy 중계 서버에 route를 적용하더라도 중계 서버의 OS 방화벽이 외부 포트를 막고 있으면 Agent 또는 게임 서버 접속이 실패한다.

## 변경 내용

- HAProxy route 적용 시 중계 서버에서 외부 TCP/UDP 포트를 함께 개방한다.
- `ufw`와 `firewalld`를 우선 지원한다.
- 허용 CIDR이 있으면 전체 개방이 아니라 CIDR 제한 규칙으로 개방한다.
- HAProxy route 제거 시 같은 방화벽 규칙을 정리한다.
- 키 인증 환경에서 sudo 비밀번호가 없는 경우 `sudo -n`을 사용해 비밀번호 프롬프트 대기를 피하도록 정리했다.

## 검증

```bash
npm run desktop:typecheck
npm run desktop:build
```

두 명령 모두 통과했다.

## 남은 확인

- 실제 중계 서버에서 HAProxy route 적용 후 `ufw status` 또는 `firewall-cmd --list-all` 기준으로 포트 개방 결과를 확인해야 한다.
