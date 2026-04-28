import type { DockerStatusResponse } from "../types/api";

interface AgentStatusPanelProps {
  status?: DockerStatusResponse;
  message: string;
}

export function AgentStatusPanel({ message, status }: AgentStatusPanelProps) {
  const statusClassName = status?.available
    ? status.mode === "cli"
      ? "stateBadge connected"
      : "stateBadge setupRequired"
    : "stateBadge offline";

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
      <p className="helperText">
        {status?.mode === "cli"
          ? "실제 Docker CLI 제어가 활성화되어 있습니다."
          : "memory mode에서는 UI와 API 흐름만 확인합니다."}
      </p>
    </article>
  );
}
