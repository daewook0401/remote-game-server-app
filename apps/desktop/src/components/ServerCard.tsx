import type { ManagedServer } from "../types/server";

interface ServerCardProps {
  isSelected: boolean;
  onCheck: (serverId: string) => void;
  onSelect: (serverId: string) => void;
  server: ManagedServer;
}

const statusLabels: Record<ManagedServer["status"], string> = {
  connected: "연결됨",
  setupRequired: "설정 필요",
  offline: "오프라인"
};

export function ServerCard({ isSelected, onCheck, onSelect, server }: ServerCardProps) {
  return (
    <article className={isSelected ? "panel serverCard selected" : "panel serverCard"}>
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
          <dt>Agent URL</dt>
          <dd>{server.agentBaseUrl}</dd>
        </div>
        <div>
          <dt>SSH key</dt>
          <dd>{server.sshKeyPath || "-"}</dd>
        </div>
        <div>
          <dt>OS</dt>
          <dd>{server.osType}</dd>
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
      <div className="cardActions">
        <button className="secondaryButton compactButton" onClick={() => onSelect(server.id)} type="button">
          선택
        </button>
        <button className="primaryButton compactButton" onClick={() => onCheck(server.id)} type="button">
          Agent 확인
        </button>
      </div>
    </article>
  );
}
