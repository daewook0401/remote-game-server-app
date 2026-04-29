import type { ManagedServer } from "../types/server";

interface ServerCardProps {
  isSelected: boolean;
  onDelete: (serverId: string) => void;
  onSelect: (serverId: string) => void;
  server: ManagedServer;
}

const statusLabels: Record<ManagedServer["status"], string> = {
  connected: "연결됨",
  setupRequired: "설정 필요",
  offline: "오프라인"
};

export function ServerCard({ isSelected, onDelete, onSelect, server }: ServerCardProps) {
  return (
    <article className={isSelected ? "panel serverCard selected" : "panel serverCard"}>
      <div className="panelHeader">
        <h2>{server.name}</h2>
        <span className={`stateBadge ${server.status}`}>{statusLabels[server.status]}</span>
      </div>
      <dl className="detailList">
        <div>
          <dt>서버 주소</dt>
          <dd>{server.host}</dd>
        </div>
        <div>
          <dt>운영체제</dt>
          <dd>{server.osType}</dd>
        </div>
        <div>
          <dt>연결 상태</dt>
          <dd>{server.agentStatus}</dd>
        </div>
        <div>
          <dt>서버 엔진</dt>
          <dd>{server.dockerStatus}</dd>
        </div>
      </dl>
      <div className="cardActions">
        <button className="primaryButton compactButton" onClick={() => onSelect(server.id)} type="button">
          관리하기
        </button>
        <button className="smallButton danger" onClick={() => onDelete(server.id)} type="button">
          삭제
        </button>
      </div>
    </article>
  );
}
