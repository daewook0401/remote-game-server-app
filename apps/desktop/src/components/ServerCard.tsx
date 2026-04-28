import type { ManagedServer } from "../types/server";

interface ServerCardProps {
  server: ManagedServer;
}

const statusLabels: Record<ManagedServer["status"], string> = {
  connected: "연결됨",
  setupRequired: "설정 필요",
  offline: "오프라인"
};

export function ServerCard({ server }: ServerCardProps) {
  return (
    <article className="panel serverCard">
      <div className="panelHeader">
        <h2>{server.name}</h2>
        <span className={`stateBadge ${server.status}`}>{statusLabels[server.status]}</span>
      </div>
      <dl className="detailList">
        <div>
          <dt>접속 대상</dt>
          <dd>{server.host}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{server.agentStatus}</dd>
        </div>
        <div>
          <dt>Docker</dt>
          <dd>{server.dockerStatus}</dd>
        </div>
      </dl>
    </article>
  );
}

