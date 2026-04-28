import { useState } from "react";
import { AgentStatusPanel } from "../components/AgentStatusPanel";
import { ContainerTable } from "../components/ContainerTable";
import { ServerCreatePanel } from "../components/ServerCreatePanel";
import { ServerCard } from "../components/ServerCard";
import { ServerRegistrationPanel } from "../components/ServerRegistrationPanel";
import { Topbar } from "../components/Topbar";
import { gameTemplates, managedServers as initialManagedServers } from "../data/serverManagement";
import {
  applyContainerAction,
  createMinecraftServer,
  getDockerStatus,
  listManagedContainers
} from "../services/agentClient";
import type { ContainerActionRequest, ContainerSummaryResponse, DockerStatusResponse } from "../types/api";
import type { ContainerSummary, ManagedServer, ServerCreateForm, ServerRegistrationForm } from "../types/server";

type NoticeKind = "info" | "success" | "warning" | "error";

export function ServerManagementPage() {
  const [message, setMessage] = useState("Agent API 대기");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");
  const [dockerStatus, setDockerStatus] = useState<DockerStatusResponse>();
  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [managedServers, setManagedServers] = useState<ManagedServer[]>(initialManagedServers);
  const [activeServerId, setActiveServerId] = useState("local");
  const [createForm, setCreateForm] = useState<ServerCreateForm>({
    targetType: "local",
    sshHost: "",
    sshPort: 22,
    sshUser: "",
    gameTemplateId: "minecraft-java",
    serverName: "minecraft-survival",
    internalPort: 25565,
    externalPort: 25565,
    memory: "2G",
    eulaAccepted: true
  });
  const [registrationForm, setRegistrationForm] = useState<ServerRegistrationForm>({
    name: "새 원격 서버",
    targetType: "remote",
    sshHost: "",
    sshPort: 22,
    sshUser: "",
    agentBaseUrl: "http://127.0.0.1:18080"
  });
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<ContainerActionRequest>();
  const activeServer = managedServers.find((server) => server.id === activeServerId) ?? managedServers[0];
  const activeAgentBaseUrl = activeServer?.agentBaseUrl;
  const isCliMode = dockerStatus?.mode === "cli";

  function upsertContainer(container: ContainerSummaryResponse) {
    setContainers((current) => {
      const next = current.filter((item) => item.id !== container.id);
      return [...next, container];
    });
  }

  async function handleCreateServer() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    const template = gameTemplates.find((item) => item.id === createForm.gameTemplateId);
    if (!template) {
      setNoticeKind("error");
      setMessage("선택한 게임 템플릿을 찾을 수 없습니다.");
      return;
    }

    if (activeServer.targetType !== "local" && (!activeServer.sshHost || !activeServer.sshUser)) {
      setNoticeKind("error");
      setMessage("SSH 서버 또는 클라우드 서버는 SSH host와 user가 필요합니다.");
      return;
    }

    if (isCliMode && !pendingCreate) {
      setPendingCreate(true);
      setNoticeKind("warning");
      setMessage("Docker CLI mode입니다. 서버 생성을 다시 누르면 실제 docker run을 요청합니다.");
      return;
    }

    if (dockerStatus && !isCliMode) {
      setNoticeKind("warning");
      setMessage("현재 memory mode입니다. 실제 Docker 컨테이너는 생성되지 않습니다.");
    }

    try {
      const container = await createMinecraftServer({
        serverId: activeServer.id,
        targetType: activeServer.targetType,
        sshHost: activeServer.sshHost || createForm.sshHost || undefined,
        sshPort: activeServer.targetType === "local" ? undefined : activeServer.sshPort ?? createForm.sshPort,
        sshUser: activeServer.sshUser || createForm.sshUser || undefined,
        gameTemplateId: template.id,
        instanceId: `${template.id}-${createForm.serverName}`,
        containerName: createForm.serverName,
        image: template.image,
        internalPort: createForm.internalPort,
        externalPort: createForm.externalPort,
        memory: createForm.memory,
        eulaAccepted: createForm.eulaAccepted
      }, activeAgentBaseUrl);
      upsertContainer(container);
      void refreshContainers();
      setPendingCreate(false);
      setNoticeKind(isCliMode ? "success" : "warning");
      setMessage(`${container.name} 생성 요청 성공`);
    } catch (error) {
      setPendingCreate(false);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 요청 실패");
    }
  }

  async function handleContainerAction(
    containerId: string,
    action: ContainerActionRequest["action"]
  ) {
    try {
      const container = await applyContainerAction({ containerId, action }, activeAgentBaseUrl);

      if (action === "delete") {
        setContainers((current) => current.filter((item) => item.id !== containerId));
        setPendingAction(undefined);
        setNoticeKind(isCliMode ? "success" : "warning");
        setMessage(`${containerId} 삭제 요청 성공`);
        return;
      }

      upsertContainer(container);
      void refreshContainers();
      setPendingAction(undefined);
      setNoticeKind(isCliMode ? "success" : "warning");
      setMessage(`${containerId} ${action} 요청 성공`);
    } catch (error) {
      setPendingAction(undefined);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 작업 요청 실패");
    }
  }

  function handleRequestContainerAction(
    containerId: string,
    action: ContainerActionRequest["action"]
  ) {
    if (!isCliMode && action !== "delete") {
      void handleContainerAction(containerId, action);
      return;
    }

    setPendingAction({ containerId, action });
    setNoticeKind("warning");
    setMessage(`${containerId} ${action} 작업을 다시 누르면 Agent 요청을 보냅니다.`);
  }

  async function handleCheckAgent() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    try {
      const status = await getDockerStatus(activeServer.agentBaseUrl);
      setDockerStatus(status);
      const managedContainers = await listManagedContainers(activeServer.agentBaseUrl);
      setContainers(managedContainers);
      updateServerStatus(activeServer.id, status, true);
      setNoticeKind(status.mode === "cli" ? "success" : "warning");
      setMessage(`${activeServer.name} Agent 확인 완료: ${status.mode} mode, 컨테이너 ${managedContainers.length}개`);
    } catch (error) {
      setDockerStatus(undefined);
      updateServerOffline(activeServer.id);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 상태 확인 실패");
    }
  }

  async function refreshContainers() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    try {
      const managedContainers = await listManagedContainers(activeServer.agentBaseUrl);
      setContainers(managedContainers);
      setNoticeKind("success");
      setMessage(`${activeServer.name} Docker 컨테이너 목록 갱신 완료: ${managedContainers.length}개`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 목록 조회 실패");
    }
  }

  function handleRegisterServer() {
    if (!registrationForm.name || !registrationForm.agentBaseUrl) {
      setNoticeKind("error");
      setMessage("서버 이름과 Agent URL이 필요합니다.");
      return;
    }

    if (registrationForm.targetType !== "local" && (!registrationForm.sshHost || !registrationForm.sshUser)) {
      setNoticeKind("error");
      setMessage("SSH 서버 또는 클라우드 서버는 SSH host와 user가 필요합니다.");
      return;
    }

    const nextServer: ManagedServer = {
      id: `${registrationForm.targetType}-${Date.now()}`,
      name: registrationForm.name,
      targetType: registrationForm.targetType,
      host:
        registrationForm.targetType === "local"
          ? "localhost"
          : `${registrationForm.sshUser}@${registrationForm.sshHost}:${registrationForm.sshPort}`,
      agentBaseUrl: registrationForm.agentBaseUrl,
      sshHost: registrationForm.sshHost || undefined,
      sshPort: registrationForm.targetType === "local" ? undefined : registrationForm.sshPort,
      sshUser: registrationForm.sshUser || undefined,
      status: "setupRequired",
      agentStatus: "notInstalled",
      dockerStatus: "unknown"
    };

    setManagedServers((current) => [...current, nextServer]);
    setActiveServerId(nextServer.id);
    setContainers([]);
    setDockerStatus(undefined);
    setNoticeKind("success");
    setMessage(`${nextServer.name} 등록 완료. Agent 확인을 눌러 연결 상태를 확인하세요.`);
  }

  async function handleCheckServer(serverId: string) {
    setActiveServerId(serverId);
    const server = managedServers.find((item) => item.id === serverId);
    if (!server) {
      return;
    }

    try {
      const status = await getDockerStatus(server.agentBaseUrl);
      const managedContainers = await listManagedContainers(server.agentBaseUrl);
      setDockerStatus(status);
      setContainers(managedContainers);
      updateServerStatus(server.id, status, true);
      setNoticeKind(status.mode === "cli" ? "success" : "warning");
      setMessage(`${server.name} Agent 확인 완료: ${status.mode} mode, 컨테이너 ${managedContainers.length}개`);
    } catch (error) {
      setDockerStatus(undefined);
      setContainers([]);
      updateServerOffline(server.id);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 상태 확인 실패");
    }
  }

  function handleSelectServer(serverId: string) {
    const server = managedServers.find((item) => item.id === serverId);
    setActiveServerId(serverId);
    setContainers([]);
    setDockerStatus(undefined);
    setNoticeKind("info");
    setMessage(server ? `${server.name} 선택됨. Agent 확인 후 컨테이너를 관리하세요.` : "서버 선택됨");
  }

  function updateServerStatus(serverId: string, status: DockerStatusResponse, isConnected: boolean) {
    setManagedServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? {
              ...server,
              status: isConnected ? "connected" : "setupRequired",
              agentStatus: isConnected ? "connected" : "offline",
              dockerStatus: status.mode === "cli" ? "ready" : "needsSetup"
            }
          : server
      )
    );
  }

  function updateServerOffline(serverId: string) {
    setManagedServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? {
              ...server,
              status: "offline",
              agentStatus: "offline",
              dockerStatus: "unknown"
            }
          : server
      )
    );
  }

  return (
    <>
      <Topbar
        actionLabel="Agent 상태 확인"
        secondaryActionLabel="컨테이너 새로고침"
        description="로컬, 기존 원격 서버, 클라우드 서버를 등록하고 Minecraft 컨테이너를 관리합니다."
        onAction={handleCheckAgent}
        onSecondaryAction={refreshContainers}
        title="서버 관리"
      />

      <div className={`noticeBar ${noticeKind}`}>{message}</div>

      <article className="contextPanel">
        <span>선택된 서버</span>
        <strong>{activeServer?.name ?? "-"}</strong>
        <code>{activeServer?.agentBaseUrl ?? "-"}</code>
      </article>

      <section className="panelGrid">
        <AgentStatusPanel message={message} status={dockerStatus} />
        <article className="panel">
          <div className="panelHeader">
            <h2>다음 작업</h2>
          </div>
          <ul className="statusList">
            <li>Agent 상태 확인</li>
            <li>Docker mode 확인</li>
            <li>Minecraft 템플릿 선택</li>
            <li>컨테이너 생성 후 콘솔 확인</li>
          </ul>
        </article>
      </section>

      <article className={isCliMode ? "safetyPanel cli" : "safetyPanel"}>
        <div>
          <h2>{isCliMode ? "Docker CLI mode" : "Memory mode"}</h2>
          <p>
            {isCliMode
              ? "서버 생성과 컨테이너 작업이 실제 Docker 명령으로 실행될 수 있습니다."
              : "현재는 안전한 테스트 모드입니다. 서버 생성은 Agent API 흐름만 확인하고 실제 Docker 컨테이너를 만들지 않습니다."}
          </p>
        </div>
        <code>{isCliMode ? "AGENT_DOCKER_MODE=cli" : "AGENT_DOCKER_MODE not set"}</code>
      </article>

      {pendingCreate ? (
        <article className="confirmPanel">
          <h2>실제 Docker 생성 확인</h2>
          <p>다시 `서버 생성`을 누르면 Agent가 Docker CLI adapter를 통해 Minecraft 컨테이너 생성을 요청합니다.</p>
        </article>
      ) : null}

      <ServerCreatePanel form={createForm} onChange={setCreateForm} onSubmit={handleCreateServer} />

      <ServerRegistrationPanel
        form={registrationForm}
        onChange={setRegistrationForm}
        onSubmit={handleRegisterServer}
      />

      <section className="modeGrid" aria-label="등록된 서버">
        {managedServers.map((server) => (
          <ServerCard
            isSelected={server.id === activeServerId}
            key={server.id}
            onCheck={handleCheckServer}
            onSelect={handleSelectServer}
            server={server}
          />
        ))}
      </section>

      <ContainerTable
        containers={containers}
        onAction={handleContainerAction}
        onRequestAction={handleRequestContainerAction}
        pendingAction={pendingAction}
      />
    </>
  );
}
