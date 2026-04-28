import { Topbar } from "../components/Topbar";

const guides = [
  "Amazon EC2 보안 그룹과 SSH 접속 준비",
  "Agent 설치와 Docker 데몬 확인",
  "UDP 게임 서버 포트 안내",
  "Nginx Stream 내부망 전달 안내",
  "직접 포트포워딩과 방화벽 확인"
];

export function GuidesPage() {
  return (
    <>
      <Topbar
        actionLabel="가이드 열기"
        description="자동 원격 수정이 어려운 영역은 사용자가 따라 할 수 있는 안내로 제공합니다."
        onAction={() => undefined}
        title="안내 가이드"
      />

      <article className="panel widePanel">
        <ul className="guideList">
          {guides.map((guide) => (
            <li key={guide}>{guide}</li>
          ))}
        </ul>
      </article>
    </>
  );
}

