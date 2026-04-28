import type { ConnectionMode } from "../types/publish";

export const connectionModes: ConnectionMode[] = [
  {
    title: "점프 서버 방식",
    status: "MVP",
    description: "Agent와 FRP TCP 터널로 내부망 게임 서버를 외부에 공개합니다."
  },
  {
    title: "직접 외부 오픈",
    status: "Guide",
    description: "포트포워딩, 방화벽, Docker 포트 매핑 확인 가이드를 제공합니다."
  },
  {
    title: "UDP / Nginx Stream",
    status: "Guide",
    description: "자동 원격 수정 대신 사용자가 따라 할 수 있는 안내를 제공합니다."
  }
];
