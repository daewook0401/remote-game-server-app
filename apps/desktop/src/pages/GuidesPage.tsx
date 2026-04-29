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
        description="서버 설정 중 막히는 부분은 여기서 단계별 안내를 확인하세요."
        onAction={() => undefined}
        title="도움말"
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

