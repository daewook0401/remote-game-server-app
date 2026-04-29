import type { ContainerActionRequest, DockerStatusResponse } from "../types/api";
import type { ContainerSummary, ManagedServer, ServerCreateReadiness } from "../types/server";
import { AgentStatusPanel } from "./AgentStatusPanel";
import { ContainerTable } from "./ContainerTable";
import { ServerCreateReadinessPanel } from "./ServerCreateReadinessPanel";

interface ServerDetailViewProps {
  activeServer: ManagedServer;
  containers: ContainerSummary[];
  createReadiness: ServerCreateReadiness;
  dockerStatus?: DockerStatusResponse;
  isServerDetailRoute: boolean;
  message: string;
  pendingAction?: ContainerActionRequest;
  pendingFirewallOpen: boolean;
  shouldWarnAgentExposure: boolean;
  onBackToList: () => void;
  onCheckAgent: () => void;
  onOpenFirewallPort: () => void;
  onOpenGameCreate: () => void;
  onOpenConsole: (container: ContainerSummary) => void;
  onRefreshContainers: () => void;
  onRequestAgentUpdate: () => void;
  onRequestContainerAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
  onRunContainerAction: (containerId: string, action: ContainerActionRequest["action"]) => void;
  onTestSSH: () => void;
}

export function ServerDetailView({
  activeServer,
  containers,
  createReadiness,
  dockerStatus,
  message,
  pendingAction,
  pendingFirewallOpen,
  shouldWarnAgentExposure,
  onBackToList,
  onCheckAgent,
  onOpenFirewallPort,
  onOpenGameCreate,
  onOpenConsole,
  onRefreshContainers,
  onRequestAgentUpdate,
  onRequestContainerAction,
  onRunContainerAction,
  onTestSSH
}: ServerDetailViewProps) {
  return (
    <>
      <article className="contextPanel">
        <span>관리 중인 서버</span>
        <strong>{activeServer.name}</strong>
        <code>{activeServer.agentBaseUrl}</code>
        <button className="secondaryButton compactButton" onClick={onBackToList} type="button">
          목록으로
        </button>
      </article>

      {shouldWarnAgentExposure ? (
        <article className="confirmPanel">
          <h2>보안 주의</h2>
          <p>
            이 서버는 인증 없이 외부에서 접근 가능한 상태입니다. 관리 포트가 노출되지 않도록 토큰 설정을 권장합니다.
          </p>
        </article>
      ) : null}

      <section className="panelGrid">
        <AgentStatusPanel message={message} status={dockerStatus} />
        <article className="panel">
          <div className="panelHeader">
            <h2>연결 설정</h2>
          </div>
          <div className="formActions">
            <button className="secondaryButton fullWidthButton" onClick={onCheckAgent} type="button">
              연결 상태 확인
            </button>
            {activeServer.targetType !== "local" ? (
              <>
                <button className="secondaryButton fullWidthButton" onClick={onTestSSH} type="button">
                  원격 접속 확인
                </button>
                <button className="secondaryButton fullWidthButton" onClick={onRequestAgentUpdate} type="button">
                  에이전트 업데이트
                </button>
                <button
                  className={pendingFirewallOpen ? "secondaryButton fullWidthButton warningButton" : "secondaryButton fullWidthButton"}
                  onClick={onOpenFirewallPort}
                  type="button"
                >
                  {pendingFirewallOpen ? "sudo 허용 후 포트 열기" : "포트 열기"}
                </button>
              </>
            ) : null}
          </div>
        </article>
      </section>

      <ServerCreateReadinessPanel readiness={createReadiness} />

      <ContainerTable
        containers={containers}
        onAction={onRunContainerAction}
        onAddContainer={onOpenGameCreate}
        onOpenConsole={onOpenConsole}
        onRefreshContainers={onRefreshContainers}
        onRequestAction={onRequestContainerAction}
        pendingAction={pendingAction}
      />
    </>
  );
}
