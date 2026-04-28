import type { DockerStatusResponse } from "../types/api";
import { EXPECTED_AGENT_VERSION } from "../services/agentClient";

interface AgentStatusPanelProps {
  status?: DockerStatusResponse;
  message: string;
}

export function AgentStatusPanel({ message, status }: AgentStatusPanelProps) {
  const isExpectedVersion = status?.agentVersion === EXPECTED_AGENT_VERSION;
  const statusClassName = status?.available && isExpectedVersion ? "stateBadge connected" : "stateBadge offline";

  return (
    <article className="panel agentStatusPanel">
      <div className="panelHeader">
        <h2>Agent / Docker 상태</h2>
        <span className={statusClassName}>
          {status?.available ? (isExpectedVersion ? status.mode : "업데이트 필요") : "확인 필요"}
        </span>
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
        <div>
          <dt>Version</dt>
          <dd>{status?.agentVersion ?? "확인 불가"} / {EXPECTED_AGENT_VERSION}</dd>
        </div>
      </dl>
      <p className="helperText">
        {status?.available && !isExpectedVersion
          ? "Agent 버전이 다릅니다. Agent 업데이트/설치를 다시 실행하세요."
          : "실제 Docker CLI 연결 상태를 기준으로 서버 생성 가능 여부를 판단합니다."}
      </p>
    </article>
  );
}
