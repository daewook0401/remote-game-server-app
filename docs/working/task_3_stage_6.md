# task_3 단계 6 보고: HAProxy 중계 서버 방화벽 개방 보강

## 단계 제목

HAProxy route 적용 시 중계 서버 방화벽 포트 개방 추가

## 변경 파일

- `apps/desktop/electron/ssh/haproxyScripts.ts`
- `apps/desktop/electron/services/haproxyService.ts`
- `apps/desktop/src/types/server.ts`
- `docs/feedback/task_3_haproxy_relay_firewall.md`

## 변경 내용

- HAProxy route 적용 명령에 중계 서버 방화벽 개방 명령을 추가했다.
- `ufw` 환경에서는 `ufw allow`를 사용하고, 허용 CIDR이 있으면 `from CIDR to any port ... proto ...` 형식으로 제한한다.
- `firewalld` 환경에서는 전체 개방 시 `--add-port`, CIDR 제한 시 rich rule을 사용한다.
- HAProxy route 제거 시 `firewalld` rich rule도 제거하도록 정리 흐름을 맞췄다.
- Electron 결과에 `firewallOpened` 플래그를 추가했다.
- sudo 입력이 없는 키 인증 환경에서는 `sudo -n`을 사용하도록 HAProxy 적용/제거 명령의 sudo 처리도 정리했다.

## 실행한 검증 명령

```bash
npm run desktop:typecheck
npm run desktop:build
```

## 검증 결과

- 두 명령 모두 통과했다.

## 특이사항

- 방화벽 도구가 없는 서버에서는 HAProxy 적용 자체를 막지 않고 기존 흐름을 유지한다.
- 실제 포트 개방 여부는 사용자의 중계 서버 환경에서 최종 검수가 필요하다.

## 다음 단계

- 사용자의 실제 점프/중계 서버에서 HAProxy 적용, 방화벽 개방, Agent 확인까지 수동 검수한다.
