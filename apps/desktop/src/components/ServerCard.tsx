import type { ManagedServer } from "../types/server";

interface ServerCardProps {
  isSelected: boolean;
  onCheck: (serverId: string) => void;
  onDelete: (serverId: string) => void;
  onSelect: (serverId: string) => void;
  server: ManagedServer;
}

const statusLabels: Record<ManagedServer["status"], string> = {
  connected: "연결됨",
  setupRequired: "설정 필요",
  offline: "오프라인"
};

export function ServerCard({ isSelected, onCheck, onDelete, onSelect, server }: ServerCardProps) {
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
        <button className="primaryButton compactButton" onClick={() => onSelect(server.id)} type="button">
          들어가기
        </button>
        <button className="secondaryButton compactButton" onClick={() => onCheck(server.id)} type="button">
          상태 확인
        </button>
        <button className="smallButton danger" onClick={() => onDelete(server.id)} type="button">
          삭제
        </button>
      </div>
    </article>
  );
}
