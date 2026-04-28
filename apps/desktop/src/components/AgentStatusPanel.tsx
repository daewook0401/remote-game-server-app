import type { DockerStatusResponse } from "../types/api";

interface AgentStatusPanelProps {
  status?: DockerStatusResponse;
  message: string;
}

export function AgentStatusPanel({ message, status }: AgentStatusPanelProps) {
  const statusClassName = status?.available ? "stateBadge connected" : "stateBadge offline";

  return (
    <article className="panel agentStatusPanel">
      <div className="panelHeader">
        <h2>Agent / Docker 상태</h2>
        <span className={statusClassName}>{status?.available ? status.mode : "확인 필요"}</span>
      </div>
      <dl className="detailList">
        <div>
          <dt>Mode</dt>
          <dd>{status?.mode ?? "-"}</dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{status?.message ?? message}</dd>
        </div>
      </dl>
      <p className="helperText">실제 Docker CLI 연결 상태를 기준으로 서버 생성 가능 여부를 판단합니다.</p>
    </article>
  );
}
