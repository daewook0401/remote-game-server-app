import { useEffect, useState } from "react";
import { AgentUpdateModal } from "../components/AgentUpdateModal";
import { AgentStatusPanel } from "../components/AgentStatusPanel";
import { AppModal } from "../components/AppModal";
import { ContainerConsolePanel } from "../components/ContainerConsolePanel";
import { ContainerDeleteModal, type ContainerDeleteTarget } from "../components/ContainerDeleteModal";
import { ContainerTable } from "../components/ContainerTable";
import { CreateServerConfirmModal } from "../components/CreateServerConfirmModal";
import { DockerInstallGuide } from "../components/DockerInstallGuide";
import { ServerCreatePanel } from "../components/ServerCreatePanel";
import { ServerCreateReadinessPanel } from "../components/ServerCreateReadinessPanel";
import { ServerCard } from "../components/ServerCard";
import { ServerDeleteModal, type ServerDeleteTarget } from "../components/ServerDeleteModal";
import { ServerDetailView } from "../components/ServerDetailView";
import { ServerRegistrationPanel } from "../components/ServerRegistrationPanel";
import { ToastViewport, type ToastMessage } from "../components/ToastViewport";
import { Topbar } from "../components/Topbar";
import { gameTemplates } from "../data/serverManagement";
import {
  applyContainerAction,
  createMinecraftServer,
  EXPECTED_AGENT_VERSION,
  getDockerStatus,
  listManagedContainers
} from "../services/agentClient";
import { prepareRemoteAgent, removeRemoteAgent } from "../services/agentBootstrapClient";
import { closeRemoteFirewallPort, openRemoteFirewallPort } from "../services/firewallClient";
import { applyRemoteHaproxy, checkRemoteHaproxy, installRemoteHaproxy, removeRemoteHaproxyRoutes } from "../services/haproxyClient";
import { loadStoredServers, saveStoredServers } from "../services/serverStorage";
import {
  AGENT_PORT,
  buildAgentBaseUrl,
  buildAgentHaproxyApplyRequest,
  buildGameHaproxyApplyRequest,
  buildGameHaproxyRemoveRequest,
  buildHaproxySshRequest,
  buildProxyServerId,
  buildServerFromRegistration as createServerFromRegistration,
  buildTargetSshRequest,
  createDefaultRegistrationForm,
  isDocumentationCidrs,
  normalizeRegistrationForm
} from "../services/serverRegistrationModel";
import { buildCreateReadiness as buildCreateReadinessModel, dockerMessage } from "../services/serverReadiness";
import { testSSHConnection } from "../services/sshClient";
import type { ContainerActionRequest, ContainerSummaryResponse, DockerStatusResponse } from "../types/api";
import type {
  ContainerSummary,
  DockerIssue,
  ManagedServer,
  ServerCreateForm,
  FirewallClosePortRequest,
  FirewallOpenPortRequest,
  ServerOsType,
  ServerRegistrationForm
} from "../types/server";

type NoticeKind = "info" | "success" | "warning" | "error";

const PRODUCT_VOLUME_ROOT = "/remote-game-server/volume";

function readServerDetailIdFromHash() {
  const match = window.location.hash.match(/^#\/servers\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function ServerManagementPage() {
  const [message, setMessage] = useState("Agent API 대기");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");
  const [dockerStatus, setDockerStatus] = useState<DockerStatusResponse>();
  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [managedServers, setManagedServers] = useState<ManagedServer[]>([]);
  const [activeServerId, setActiveServerId] = useState("");
  const [isStorageReady, setIsStorageReady] = useState(false);
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
  const [registrationForm, setRegistrationForm] = useState<ServerRegistrationForm>(() => createDefaultRegistrationForm());
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<ContainerActionRequest>();
  const [createConfirmModalOpen, setCreateConfirmModalOpen] = useState(false);
  const [createSudoPassword, setCreateSudoPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContainerDeleteTarget>();
  const [serverDeleteTarget, setServerDeleteTarget] = useState<ServerDeleteTarget>();
  const [pendingFirewallOpen, setPendingFirewallOpen] = useState(false);
  const [pendingRegistrationAction, setPendingRegistrationAction] = useState<"ssh" | "agent" | "firewall" | "register">();
  const [haproxyInstallModalOpen, setHaproxyInstallModalOpen] = useState(false);
  const [haproxyInstallPassword, setHaproxyInstallPassword] = useState("");
  const [agentUpdateModalOpen, setAgentUpdateModalOpen] = useState(false);
  const [agentUpdatePassword, setAgentUpdatePassword] = useState("");
  const [serverRegistrationOpen, setServerRegistrationOpen] = useState(false);
  const [gameCreateOpen, setGameCreateOpen] = useState(false);
  const [consoleContainer, setConsoleContainer] = useState<ContainerSummary>();
  const [detailServerId, setDetailServerId] = useState(() => readServerDetailIdFromHash());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dockerGuide, setDockerGuide] = useState<{ issue: DockerIssue; osType: ServerOsType }>();
  const [autoCheckedServerIds, setAutoCheckedServerIds] = useState<string[]>([]);
  const detailServer = detailServerId ? managedServers.find((server) => server.id === detailServerId) : undefined;
  const activeServer = detailServer ?? managedServers.find((server) => server.id === activeServerId) ?? managedServers[0];
  const isServerDetailRoute = Boolean(detailServer);
  const activeAgentBaseUrl = activeServer?.agentBaseUrl;
  const activeAgentToken = activeServer?.agentToken;
  const isCliMode = dockerStatus?.mode === "cli";
  const isAgentVersionCurrent = dockerStatus?.agentVersion === EXPECTED_AGENT_VERSION;
  const createReadiness = buildCreateReadinessModel({
    activeServer,
    createForm,
    dockerStatus,
    expectedAgentVersion: EXPECTED_AGENT_VERSION,
    isAgentVersionCurrent
  });
  const shouldWarnAgentExposure = Boolean(
    activeServer &&
      activeServer.targetType !== "local" &&
      !activeServer.agentToken &&
      !isLoopbackAgentUrl(activeServer.agentBaseUrl)
  );

  useEffect(() => {
    if (message === "Agent API 대기") {
      return;
    }

    const toast: ToastMessage = {
      id: Date.now(),
      kind: noticeKind,
      text: message
    };
    setToasts((current) => [...current.slice(-2), toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3600);
  }, [message, noticeKind]);

  function dismissToast(id: number) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  useEffect(() => {
    function syncDetailRoute() {
      const nextDetailServerId = readServerDetailIdFromHash();
      setDetailServerId(nextDetailServerId);
      if (nextDetailServerId) {
        setActiveServerId(nextDetailServerId);
      }
    }

    syncDetailRoute();
    window.addEventListener("hashchange", syncDetailRoute);
    return () => window.removeEventListener("hashchange", syncDetailRoute);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadServers() {
      try {
        const storedServers = await loadStoredServers();
        if (ignore) {
          return;
        }

        if (storedServers?.length) {
          setManagedServers(storedServers);
          setActiveServerId(storedServers[0].id);
          syncRegistrationFormFromServer(storedServers[0]);
          setMessage(`저장된 서버 ${storedServers.length}개를 불러왔습니다.`);
        } else {
          setManagedServers([]);
          setActiveServerId("");
          setMessage("등록된 서버가 없습니다. 서버를 먼저 추가하세요.");
        }
      } catch (error) {
        if (!ignore) {
          setNoticeKind("error");
          setMessage(error instanceof Error ? error.message : "저장된 서버 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsStorageReady(true);
        }
      }
    }

    void loadServers();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    void saveStoredServers(managedServers).catch((error) => {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "서버 정보를 저장하지 못했습니다.");
    });
  }, [isStorageReady, managedServers]);

  useEffect(() => {
    if (!isStorageReady || !isServerDetailRoute || !activeServer) {
      return;
    }

    if (autoCheckedServerIds.includes(activeServer.id)) {
      return;
    }

    setAutoCheckedServerIds((current) => [...current, activeServer.id]);
    void checkAgentForServer(activeServer, "auto");
  }, [isStorageReady, isServerDetailRoute, activeServer?.id]);

  function upsertContainer(container: ContainerSummaryResponse) {
    setContainers((current) => {
      const next = current.filter((item) => item.id !== container.id);
      return [...next, container];
    });
  }

  async function handleCreateServer() {
    if (!createReadiness.canCreate) {
      setNoticeKind("error");
      setMessage(createReadiness.message);
      return;
    }

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

    setCreateSudoPassword("");
    setCreateConfirmModalOpen(true);
  }

  async function runCreateServer(sudoPassword?: string) {
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

    try {
      await openGameFirewallPortIfNeeded(activeServer, sudoPassword);
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
        internalPort: template.defaultPort,
        externalPort: createForm.externalPort,
        memory: createForm.memory,
        eulaAccepted: createForm.eulaAccepted,
        volumePath: buildVolumePath(template.id, createForm.serverName)
      }, activeAgentBaseUrl, activeAgentToken);
      upsertContainer(container);
      void refreshContainers();
      updateServerAfterContainerCreate(activeServer.id);
      setPendingCreate(false);
      setCreateConfirmModalOpen(false);
      setGameCreateOpen(false);
      setCreateSudoPassword("");
      setNoticeKind("success");
      setMessage(`${container.name} Docker 컨테이너 생성 완료`);
    } catch (error) {
      setPendingCreate(false);
      setCreateConfirmModalOpen(false);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 요청 실패");
    }
  }

  async function handleContainerAction(
    containerId: string,
    action: ContainerActionRequest["action"]
  ) {
    try {
      const container = await applyContainerAction({ containerId, action }, activeAgentBaseUrl, activeAgentToken);

      if (action === "delete") {
        setContainers((current) => current.filter((item) => item.id !== containerId));
        setPendingAction(undefined);
        setNoticeKind("success");
        setMessage(`${containerId} 삭제 요청 성공`);
        return;
      }

      upsertContainer(container);
      void refreshContainers();
      setPendingAction(undefined);
      setNoticeKind("success");
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
    if (!isCliMode) {
      setNoticeKind("error");
      setMessage("Docker CLI 연결이 확인된 뒤 컨테이너 작업을 실행할 수 있습니다.");
      return;
    }

    if (action === "delete") {
      const container = containers.find((item) => item.id === containerId);
      if (!container) {
        setNoticeKind("error");
        setMessage("삭제할 컨테이너를 찾을 수 없습니다.");
        return;
      }

      setDeleteTarget({
        container,
        server: activeServer,
        step: "scope",
        deleteData: false,
        confirmation: "",
        firewallMode: "keep",
        firewallPassword: "",
        haproxyPassword: ""
      });
      return;
    }

    setPendingAction({ containerId, action });
    setNoticeKind("warning");
    setMessage(`${containerId} ${action} 작업을 다시 누르면 Agent 요청을 보냅니다.`);
  }

  async function handleConfirmDeleteContainer() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.deleteData && deleteTarget.confirmation !== deleteTarget.container.name) {
      setNoticeKind("error");
      setMessage("전체 데이터 삭제를 진행하려면 서버 이름을 정확히 입력해야 합니다.");
      return;
    }

    if (deleteTarget.deleteData && !deleteTarget.container.volumePath) {
      setNoticeKind("error");
      setMessage("이 컨테이너는 관리 볼륨 경로를 확인할 수 없어 전체 데이터 삭제를 자동으로 진행할 수 없습니다.");
      return;
    }

    try {
      if (
        activeServer?.connectionMode === "jumpSsh" &&
        activeServer.agentAccessMode === "haproxy" &&
        activeServer.haproxyAuthMethod === "password" &&
        !deleteTarget.haproxyPassword
      ) {
        setNoticeKind("error");
        setMessage("HAProxy 게임 포트 라우트를 정리하려면 경유 서버 SSH/sudo 비밀번호가 필요합니다.");
        return;
      }

      if (deleteTarget.firewallMode !== "keep") {
        if (
          activeServer?.connectionMode === "jumpSsh" &&
          !deleteTarget.haproxyPassword
        ) {
          setNoticeKind("error");
          setMessage("경유 서버의 외부 포트 방화벽도 정리하려면 HAProxy SSH/sudo 비밀번호가 필요합니다.");
          return;
        }

        const firewallRequest = buildCloseFirewallRequest(
          activeServer,
          deleteTarget.container.port,
          deleteTarget.firewallPassword,
          deleteTarget.firewallMode,
          deleteTarget.haproxyPassword
        );
        if (!firewallRequest) {
          setNoticeKind("error");
          setMessage("방화벽 규칙을 정리하려면 선택된 서버의 SSH 정보와 sudo 비밀번호가 필요합니다.");
          return;
        }

        await closeRemoteFirewallPort(firewallRequest);

        const relayFirewallRequest = buildHaproxyCloseFirewallRequest(
          activeServer,
          deleteTarget.container.port,
          deleteTarget.haproxyPassword,
          deleteTarget.firewallMode
        );
        if (relayFirewallRequest) {
          await closeRemoteFirewallPort(relayFirewallRequest);
        }
      }

      await applyContainerAction({
        containerId: deleteTarget.container.id,
        action: "delete",
        deleteData: deleteTarget.deleteData,
        volumePath: deleteTarget.container.volumePath
      }, activeAgentBaseUrl, activeAgentToken);

      let haproxyCleanupFailed = false;
      if (activeServer?.connectionMode === "jumpSsh" && activeServer.agentAccessMode === "haproxy") {
        try {
          await removeRemoteHaproxyRoutes(
            buildGameHaproxyRemoveRequest(
              activeServer,
              deleteTarget.container.port,
              "tcp",
              deleteTarget.haproxyPassword
            )
          );
        } catch {
          haproxyCleanupFailed = true;
        }
      }

      setContainers((current) => current.filter((item) => item.id !== deleteTarget.container.id));
      setDeleteTarget(undefined);
      setNoticeKind(haproxyCleanupFailed ? "warning" : "success");
      setMessage(
        haproxyCleanupFailed
          ? `${deleteTarget.container.name} 컨테이너는 삭제했지만 HAProxy 게임 포트 라우트 정리는 확인이 필요합니다.`
          : deleteTarget.deleteData
            ? `${deleteTarget.container.name} 컨테이너와 전체 데이터를 삭제했습니다.`
            : `${deleteTarget.container.name} 컨테이너를 삭제했습니다. 볼륨 데이터는 유지됩니다.`
      );
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 삭제 요청 실패");
    }
  }

  function handleNextDeleteStep() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.deleteData && deleteTarget.confirmation !== deleteTarget.container.name) {
      setNoticeKind("error");
      setMessage("전체 데이터 삭제를 진행하려면 서버 이름을 정확히 입력해야 합니다.");
      return;
    }

    if (deleteTarget.deleteData && !deleteTarget.container.volumePath) {
      setNoticeKind("error");
      setMessage("이 컨테이너는 관리 볼륨 경로를 확인할 수 없어 전체 데이터 삭제를 자동으로 진행할 수 없습니다.");
      return;
    }

    if (activeServer?.targetType === "local") {
      void handleConfirmDeleteContainer();
      return;
    }

    setDeleteTarget({ ...deleteTarget, step: "firewall" });
  }

  async function checkAgentForServer(server: ManagedServer, mode: "auto" | "manual") {
    try {
      const status = await getDockerStatus(server.agentBaseUrl, server.agentToken);
      const managedContainers = await listManagedContainers(server.agentBaseUrl, server.agentToken);
      setDockerStatus(status);
      setContainers(managedContainers);
      updateServerStatus(server.id, status, true);
      const versionCurrent = status.agentVersion === EXPECTED_AGENT_VERSION;
      setNoticeKind(versionCurrent && status.mode === "cli" ? "success" : "warning");
      setMessage(
        versionCurrent
          ? `${server.name} Agent 상태 확인 완료: ${status.mode} mode, 컨테이너 ${managedContainers.length}개`
          : `${server.name} Agent 업데이트 필요: 현재 ${status.agentVersion ?? "확인 불가"}, 필요 ${EXPECTED_AGENT_VERSION}`
      );
    } catch (error) {
      setDockerStatus(undefined);
      setContainers([]);
      updateServerOffline(server.id);
      setNoticeKind("error");
      setMessage(
        error instanceof Error
          ? error.message
          : mode === "auto"
            ? "Agent 자동 상태 확인 실패"
            : "Agent 상태 확인 실패"
      );
    }
  }

  async function handleCheckAgent() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    await checkAgentForServer(activeServer, "manual");
  }

  async function refreshContainers() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    try {
      const managedContainers = await listManagedContainers(activeServer.agentBaseUrl, activeServer.agentToken);
      setContainers(managedContainers);
      setNoticeKind("success");
      setMessage(`${activeServer.name} Docker 컨테이너 목록 갱신 완료: ${managedContainers.length}개`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 목록 조회 실패");
    }
  }

  async function handleRegisterServer() {
    const agentBaseUrl = buildAgentBaseUrl(registrationForm);
    if (!registrationForm.name || !agentBaseUrl) {
      setNoticeKind("error");
      setMessage("서버 이름과 Agent URL이 필요합니다.");
      return;
    }

    if (registrationForm.targetType !== "local" && (!registrationForm.sshHost || !registrationForm.sshUser)) {
      setNoticeKind("error");
      setMessage("SSH 서버 또는 클라우드 서버는 SSH host와 user가 필요합니다.");
      return;
    }

    if (registrationForm.connectionMode === "jumpSsh" && isDocumentationCidrs(registrationForm.haproxyAllowedCidrs)) {
      setNoticeKind("error");
      setMessage("허용 IP/CIDR에 예시용 IP가 입력되어 있습니다. 비워두면 전체 허용이고, 제한하려면 실제 접속 PC의 공인 IP/32를 입력하세요.");
      return;
    }

    setPendingRegistrationAction("register");
    setNoticeKind("info");
    setMessage("Agent API 접근을 확인한 뒤 서버를 등록합니다.");

    let registrationStatus: DockerStatusResponse;
    try {
      if (registrationForm.connectionMode === "jumpSsh") {
        await applyRemoteHaproxy({
          ...buildAgentHaproxyApplyRequest(registrationForm),
          sudoPassword: registrationForm.haproxyAuthMethod === "password" ? registrationForm.haproxyPassword : undefined
        });
      }

      registrationStatus = await getDockerStatus(agentBaseUrl, registrationForm.agentToken || undefined);
    } catch (error) {
      setNoticeKind("error");
      setMessage(
        error instanceof Error
          ? `Agent 설치 후 API 접근이 확인되어야 서버를 등록할 수 있습니다. ${error.message}`
          : "Agent 설치 후 API 접근이 확인되어야 서버를 등록할 수 있습니다."
      );
      setPendingRegistrationAction(undefined);
      return;
    }

    const agentReady = registrationStatus.mode === "cli" && registrationStatus.available;
    const nextServer: ManagedServer = {
      id: `${registrationForm.targetType}-${Date.now()}`,
      name: registrationForm.name,
      targetType: registrationForm.targetType,
      connectionMode: registrationForm.connectionMode,
      agentAccessMode: registrationForm.agentAccessMode,
      osType: registrationForm.osType,
      host:
        registrationForm.targetType === "local"
          ? "localhost"
          : `${registrationForm.sshUser}@${registrationForm.sshHost}:${registrationForm.sshPort}`,
      agentBaseUrl,
      sshHost: registrationForm.sshHost || undefined,
      sshPort: registrationForm.targetType === "local" ? undefined : registrationForm.sshPort,
      sshUser: registrationForm.sshUser || undefined,
      sshAuthMethod: registrationForm.targetType === "local" ? undefined : registrationForm.sshAuthMethod,
      sshKeyPath: registrationForm.sshKeyPath || undefined,
      jumpHost: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyHost || undefined : undefined,
      jumpPort: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyPort : undefined,
      jumpUser: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyUser || undefined : undefined,
      jumpAuthMethod: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyAuthMethod : undefined,
      jumpKeyPath: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyKeyPath || undefined : undefined,
      haproxyHost: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyHost || undefined : undefined,
      haproxyPort: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyPort : undefined,
      haproxyUser: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyUser || undefined : undefined,
      haproxyAuthMethod: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyAuthMethod : undefined,
      haproxyKeyPath: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyKeyPath || undefined : undefined,
      haproxyAllowedCidrs: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyAllowedCidrs || undefined : undefined,
      haproxyAgentProxyPort: registrationForm.connectionMode === "jumpSsh" ? registrationForm.haproxyAgentProxyPort : undefined,
      agentToken: registrationForm.agentToken || undefined,
      lastAgentPrepareStatus: agentReady ? "ready" : "failed",
      lastAgentPrepareMessage: "Agent API 접근 확인 완료",
      status: agentReady ? "connected" : "setupRequired",
      agentStatus: "connected",
      dockerStatus: agentReady ? "ready" : "needsSetup"
    };

    setManagedServers((current) => [...current, nextServer]);
    navigateToServerDetail(nextServer.id);
    setContainers([]);
    setDockerStatus(registrationStatus);
    setServerRegistrationOpen(false);
    setNoticeKind("success");
    setMessage(`${nextServer.name} 등록 완료. Agent API 접근이 확인되었습니다.`);
    setPendingRegistrationAction(undefined);
  }
  async function handleTestSSHInput() {
    if (registrationForm.targetType === "local") {
      setNoticeKind("info");
      setMessage("로컬 서버는 SSH 입력 확인이 필요하지 않습니다.");
      return;
    }

    if (!registrationForm.sshHost || !registrationForm.sshUser || !registrationForm.sshPort) {
      setNoticeKind("error");
      setMessage("SSH host, port, user를 입력해야 합니다.");
      return;
    }

    if (registrationForm.sshAuthMethod === "password" && !registrationForm.sshPassword) {
      setNoticeKind("error");
      setMessage("패스워드 인증을 선택한 경우 SSH password가 필요합니다.");
      return;
    }

    if (registrationForm.sshAuthMethod === "key" && !registrationForm.sshKeyPath) {
      setNoticeKind("error");
      setMessage("키 인증을 선택한 경우 SSH key path가 필요합니다.");
      return;
    }

    try {
      setPendingRegistrationAction("ssh");
      setNoticeKind("info");
      setMessage("SSH 접속과 운영체제 확인을 진행합니다.");
      if (registrationForm.connectionMode === "jumpSsh") {
        const haproxyStatus = await checkRemoteHaproxy(buildHaproxySshRequest(registrationForm));
        if (!haproxyStatus.installed) {
          setPendingRegistrationAction(undefined);
          setHaproxyInstallPassword("");
          setHaproxyInstallModalOpen(true);
          setNoticeKind("warning");
          setMessage("외부망 경유 노드에 HAProxy가 없습니다. 설치 승인 후 다시 진행합니다.");
          return;
        }
      }

      const result = await testSSHConnection(buildTargetSshRequest(registrationForm));

      let agentApiReachable = false;
      try {
        await getDockerStatus(registrationForm.agentBaseUrl, registrationForm.agentToken || undefined);
        agentApiReachable = true;
      } catch {
        agentApiReachable = false;
      }

      const isReady = result.osMatches && result.dockerInstalled && result.dockerReady && result.agentPortOpen && agentApiReachable;
      setDockerGuide(result.dockerIssue === "none" ? undefined : { issue: result.dockerIssue, osType: registrationForm.osType });
      if (result.dockerIssue !== "none") {
        upsertDiagnosticServer("needsDocker", dockerMessage(result.dockerIssue));
      }
      setNoticeKind(isReady ? "success" : "warning");
      setMessage(
        [
          `SSH 접속 성공`,
          `OS ${result.osMatches ? "일치" : "불일치"}(${result.detectedOs})`,
          `Docker ${dockerMessage(result.dockerIssue)}`,
          `Agent 포트 ${result.agentPortOpen ? "열림" : "닫힘"}`,
          `Agent API ${agentApiReachable ? "접근 가능" : "접근 불가"}`
        ].join(" · ")
      );
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "SSH 접속 테스트 실패");
    }
    setPendingRegistrationAction(undefined);
  }

  async function handlePrepareAgent(passwordOverride?: string) {
    const sshPassword = typeof passwordOverride === "string" ? passwordOverride : registrationForm.sshPassword;
    const agentToken = ensureRemoteAgentToken(registrationForm) ?? "";
    const effectiveForm = { ...registrationForm, agentToken };
    if (registrationForm.targetType === "local") {
      setNoticeKind("info");
      setMessage("로컬 서버는 Agent 준비가 필요하지 않습니다.");
      return;
    }

    if (effectiveForm.osType === "windows" || effectiveForm.osType === "macos") {
      setNoticeKind("error");
      setMessage("현재 Agent 자동 준비는 Linux 서버만 지원합니다.");
      return;
    }

    if (!effectiveForm.sshHost || !effectiveForm.sshUser || !effectiveForm.sshPort) {
      setNoticeKind("error");
      setMessage("SSH host, port, user를 입력해야 합니다.");
      return;
    }

    if (!effectiveForm.agentDownloadUrl) {
      setNoticeKind("error");
      setMessage("Linux Agent 다운로드 URL이 필요합니다.");
      return;
    }

    if (effectiveForm.sshAuthMethod === "password" && !sshPassword) {
      setNoticeKind("error");
      setMessage("패스워드 인증을 선택한 경우 SSH password가 필요합니다.");
      return;
    }

    if (effectiveForm.sshAuthMethod === "key" && !effectiveForm.sshKeyPath) {
      setNoticeKind("error");
      setMessage("키 인증을 선택한 경우 SSH key path가 필요합니다.");
      return;
    }

    try {
      setPendingRegistrationAction("agent");
      setNoticeKind("info");
      setMessage("SSH로 Linux Agent 준비를 진행합니다.");
      const result = await prepareRemoteAgent({
        ...buildTargetSshRequest(effectiveForm, sshPassword),
        agentToken,
        downloadUrl: effectiveForm.agentDownloadUrl
      });

      let effectiveAgentBaseUrl = effectiveForm.agentBaseUrl;
      if (effectiveForm.connectionMode === "jumpSsh") {
        const haproxyResult = await applyRemoteHaproxy(buildAgentHaproxyApplyRequest(effectiveForm));
        if (!haproxyResult.applied) {
          throw new Error("HAProxy Agent 경유 설정이 적용되지 않았습니다.");
        }
        effectiveAgentBaseUrl = buildAgentBaseUrl(effectiveForm);
      }

      let agentApiReachable = false;
      let preparedStatus: DockerStatusResponse | undefined;
      try {
        preparedStatus = await getDockerStatus(effectiveAgentBaseUrl, agentToken);
        agentApiReachable = true;
      } catch {
        agentApiReachable = false;
      }

      if (preparedStatus) {
        setDockerStatus(preparedStatus);
      }

      const versionReady = preparedStatus?.agentVersion === EXPECTED_AGENT_VERSION;
      const dockerReady = preparedStatus?.mode === "cli" && preparedStatus.available;
      const ready = result.installed && result.started && result.agentPortOpen && agentApiReachable && versionReady && dockerReady;
      const preparedServerId = upsertPreparedServer(ready, agentApiReachable, agentToken);
      setNoticeKind(ready ? "success" : "warning");
      setMessage(
        [
          `Agent ${ready ? "업데이트 완료" : result.installed ? "설치됨, 확인 필요" : "설치 실패"}`,
          `실행 ${result.started ? "성공" : "확인 실패"}`,
          `포트 ${result.agentPortOpen ? "열림" : "닫힘"}`,
          `내부 방화벽 ${result.firewallOpened ? "열림" : "확인 필요"}`,
          `API ${agentApiReachable ? "접근 가능" : "접근 불가"}`,
          `버전 ${preparedStatus?.agentVersion ?? "확인 불가"} / ${EXPECTED_AGENT_VERSION}`,
          `Docker ${preparedStatus?.mode ?? "확인 불가"}`,
          `카드 ${preparedServerId ? "반영됨" : "미반영"}`
        ].join(" · ")
      );
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 준비 실패");
    }
    setPendingRegistrationAction(undefined);
  }

  function handleRequestAgentUpdate() {
    if (registrationForm.targetType === "local") {
      setNoticeKind("info");
      setMessage("로컬 서버는 Agent 업데이트가 필요하지 않습니다.");
      return;
    }

    setAgentUpdatePassword("");
    setAgentUpdateModalOpen(true);
  }

  async function handleConfirmHaproxyInstall() {
    try {
      setPendingRegistrationAction("ssh");
      setNoticeKind("info");
      setMessage("외부망 경유 노드에 HAProxy 설치를 진행합니다.");
      const result = await installRemoteHaproxy({
        ...buildHaproxySshRequest(registrationForm),
        sudoPassword: haproxyInstallPassword || undefined
      });

      if (!result.installed) {
        throw new Error("HAProxy 설치 후에도 haproxy 명령을 확인하지 못했습니다.");
      }

      setHaproxyInstallModalOpen(false);
      setHaproxyInstallPassword("");
      setNoticeKind("success");
      setMessage("HAProxy 설치를 확인했습니다. SSH 확인을 다시 실행하세요.");
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "HAProxy 설치에 실패했습니다.");
    } finally {
      setPendingRegistrationAction(undefined);
    }
  }

  async function handleConfirmAgentUpdate() {
    if (!agentUpdatePassword) {
      setNoticeKind("error");
      setMessage("Agent 업데이트를 위해 SSH 비밀번호를 입력하세요.");
      return;
    }

    setAgentUpdateModalOpen(false);
    setRegistrationForm((current) => ({ ...current, sshPassword: agentUpdatePassword, sshAuthMethod: "password" }));
    await handlePrepareAgent(agentUpdatePassword);
  }

  async function handleOpenFirewallPort() {
    const agentPort = getAgentPort(registrationForm.agentBaseUrl);
    if (!agentPort) {
      setNoticeKind("error");
      setMessage("Agent URL에서 포트를 확인할 수 없습니다. 예: http://서버IP:18080");
      return;
    }

    if (registrationForm.targetType === "local") {
      setNoticeKind("info");
      setMessage("로컬 서버는 앱에서 원격 SSH Agent 포트 설정이 필요하지 않습니다.");
      return;
    }

    if (registrationForm.connectionMode === "jumpSsh") {
      try {
        setNoticeKind("info");
        setMessage("외부망 경유 노드의 HAProxy Agent 포트 설정을 적용합니다.");
        const result = await applyRemoteHaproxy(buildAgentHaproxyApplyRequest(registrationForm));
        setNoticeKind(result.applied ? "success" : "warning");
        setMessage(result.applied ? "HAProxy Agent 포트 설정을 적용했습니다." : "HAProxy Agent 포트 설정 확인이 필요합니다.");
      } catch (error) {
        setNoticeKind("error");
        setMessage(error instanceof Error ? error.message : "HAProxy Agent 포트 설정에 실패했습니다.");
      }
      return;
    }

    if (registrationForm.osType === "windows" || registrationForm.osType === "macos") {
      setNoticeKind("error");
      setMessage("자동 포트 설정은 Linux 서버에서만 지원합니다. Windows/macOS는 안내 가이드를 따라 수동으로 열어야 합니다.");
      return;
    }

    if (!registrationForm.sshHost || !registrationForm.sshUser || !registrationForm.sshPort) {
      setNoticeKind("error");
      setMessage("포트 설정을 하려면 SSH host, port, user가 필요합니다.");
      return;
    }

    if (registrationForm.sshAuthMethod !== "password" || !registrationForm.sshPassword) {
      setNoticeKind("error");
      setMessage("SSH 비밀번호를 sudo에 재사용하는 방식이므로 SSH 인증을 password로 선택하고 password를 입력해야 합니다.");
      return;
    }

    if (!pendingFirewallOpen) {
      setPendingFirewallOpen(true);
      setNoticeKind("warning");
      setMessage(`Agent 포트 ${agentPort}/tcp 설정에는 sudo 관리자 권한이 필요합니다. 다시 누르면 SSH 비밀번호를 sudo에 재사용합니다.`);
      return;
    }

    try {
      setNoticeKind("info");
      setMessage(`Agent 포트 ${agentPort}/tcp 방화벽 설정을 진행합니다.`);
      const result = await openRemoteFirewallPort({
        host: registrationForm.sshHost,
        port: registrationForm.sshPort,
        username: registrationForm.sshUser,
        authMethod: registrationForm.sshAuthMethod,
        password: registrationForm.sshPassword,
        expectedOs: registrationForm.osType,
        sudoPassword: registrationForm.sshPassword,
        protocol: "tcp",
        firewallPort: agentPort
      });

      setPendingFirewallOpen(false);
      setNoticeKind(result.opened ? "success" : "warning");
      setMessage(
        result.opened
          ? `서버 내부 방화벽 Agent 포트 ${agentPort}/tcp 설정 완료: ${result.method}`
          : `자동 포트 설정 확인이 필요합니다: ${result.message}`
      );
    } catch (error) {
      setPendingFirewallOpen(false);
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "포트 설정 실패");
    }
  }

  async function openGameFirewallPortIfNeeded(server: ManagedServer, sudoPassword?: string) {
    if (server.targetType === "local") {
      return;
    }

    if (server.connectionMode === "jumpSsh" && server.agentAccessMode === "haproxy") {
      const internalFirewallRequest = buildServerFirewallRequest(server, createForm.externalPort, sudoPassword);
      if (!internalFirewallRequest) {
        throw new Error("HAProxy 경유 게임 포트를 열려면 내부망 서버 SSH 정보와 sudo 비밀번호가 필요합니다.");
      }

      await openRemoteFirewallPort(internalFirewallRequest);
      await applyRemoteHaproxy(buildGameHaproxyApplyRequest(server, createForm.externalPort, createForm.externalPort, "tcp", sudoPassword));
      return;
    }

    const request = buildServerFirewallRequest(server, createForm.externalPort, sudoPassword);
    if (!request) {
      throw new Error("게임 포트를 자동으로 열려면 내부망 서버 SSH 정보와 sudo 비밀번호가 필요합니다. 비밀번호는 sudo 입력으로만 사용하고 저장하지 않습니다.");
    }

    await openRemoteFirewallPort(request);
  }

  function buildServerFirewallRequest(server: ManagedServer, firewallPort: number, sudoPassword?: string): FirewallOpenPortRequest | undefined {
    if (!server.sshHost || !server.sshUser || !server.sshAuthMethod || !sudoPassword) {
      return undefined;
    }

    return {
      host: server.sshHost,
      port: server.sshPort ?? 22,
      username: server.sshUser,
      authMethod: server.sshAuthMethod,
      password: server.sshAuthMethod === "password" ? sudoPassword : undefined,
      keyPath: server.sshAuthMethod === "key" ? server.sshKeyPath : undefined,
      expectedOs: server.osType,
      sudoPassword,
      protocol: "tcp",
      firewallPort
    };
  }
  function buildCloseFirewallRequest(
    server: ManagedServer | undefined,
    firewallPort: number,
    sudoPassword: string,
    closeMode: FirewallClosePortRequest["closeMode"],
    haproxyPassword?: string
  ): FirewallClosePortRequest | undefined {
    if (!server || server.targetType === "local" || !server.sshHost || !server.sshUser || !sudoPassword || !firewallPort) {
      return undefined;
    }

    return {
      host: server.sshHost,
      port: server.sshPort ?? registrationForm.sshPort,
      username: server.sshUser,
      authMethod: server.sshAuthMethod ?? "password",
      password: (server.sshAuthMethod ?? "password") === "password" ? sudoPassword : undefined,
      keyPath: (server.sshAuthMethod ?? "password") === "key" ? server.sshKeyPath : undefined,
      connectionMode: server.connectionMode,
      jumpHost: server.connectionMode === "jumpSsh" ? server.haproxyHost : undefined,
      jumpPort: server.connectionMode === "jumpSsh" ? server.haproxyPort : undefined,
      jumpUsername: server.connectionMode === "jumpSsh" ? server.haproxyUser : undefined,
      jumpAuthMethod: server.connectionMode === "jumpSsh" ? server.haproxyAuthMethod : undefined,
      jumpPassword:
        server.connectionMode === "jumpSsh" && server.haproxyAuthMethod === "password" ? haproxyPassword : undefined,
      jumpKeyPath: server.connectionMode === "jumpSsh" && server.haproxyAuthMethod === "key" ? server.haproxyKeyPath : undefined,
      expectedOs: server.osType,
      sudoPassword,
      protocol: "tcp",
      firewallPort,
      closeMode
    };
  }

  function buildHaproxyCloseFirewallRequest(
    server: ManagedServer | undefined,
    firewallPort: number,
    sudoPassword: string,
    closeMode: FirewallClosePortRequest["closeMode"]
  ): FirewallClosePortRequest | undefined {
    if (
      !server ||
      server.connectionMode !== "jumpSsh" ||
      !server.haproxyHost ||
      !server.haproxyUser ||
      !sudoPassword ||
      !firewallPort
    ) {
      return undefined;
    }

    return {
      host: server.haproxyHost,
      port: server.haproxyPort ?? 22,
      username: server.haproxyUser,
      authMethod: server.haproxyAuthMethod ?? "password",
      password: (server.haproxyAuthMethod ?? "password") === "password" ? sudoPassword : undefined,
      keyPath: (server.haproxyAuthMethod ?? "password") === "key" ? server.haproxyKeyPath : undefined,
      expectedOs: server.osType,
      sudoPassword,
      protocol: "tcp",
      firewallPort,
      closeMode
    };
  }

  function getAgentPort(agentBaseUrl: string) {
    try {
      const url = new URL(agentBaseUrl);
      if (url.port) {
        return Number(url.port);
      }

      if (url.protocol === "http:") {
        return 80;
      }

      if (url.protocol === "https:") {
        return 443;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  function handleRegistrationFormChange(nextForm: ServerRegistrationForm) {
    setRegistrationForm(normalizeRegistrationForm(nextForm));
  }

  function ensureRemoteAgentToken(form: ServerRegistrationForm) {
    if (form.targetType === "local" || form.agentToken) {
      return form.agentToken || undefined;
    }

    const nextToken = generateAgentToken();
    setRegistrationForm((current) => ({ ...current, agentToken: nextToken }));
    return nextToken;
  }

  function generateAgentToken() {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function buildVolumePath(gameTemplateId: string, serverName: string) {
    const gameName = gameTemplateId === "minecraft-java" ? "minecraft" : gameTemplateId;
    const safeServerName = serverName.trim().replace(/[^a-zA-Z0-9_.-]/g, "-") || "server";
    return `${buildVolumeRoot()}/${gameName}/${safeServerName}`;
  }

  function buildVolumeRoot() {
    if (dockerStatus?.isSnapDocker && activeServer?.sshUser) {
      return `/home/${activeServer.sshUser}/remote-game-server/volume`;
    }

    return PRODUCT_VOLUME_ROOT;
  }

  async function handleConfirmCreateServer() {
    if (activeServer?.targetType !== "local" && !createSudoPassword) {
      setNoticeKind("error");
      setMessage("원격 서버에서 게임 포트를 열려면 SSH 비밀번호가 필요합니다.");
      return;
    }

    await runCreateServer(createSudoPassword);
  }

  function updateServerAfterContainerCreate(serverId: string) {
    setManagedServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? {
              ...server,
              lastAgentPrepareMessage: "Minecraft 생성 요청 완료"
            }
          : server
      )
    );
  }

  function upsertDiagnosticServer(status: ManagedServer["lastAgentPrepareStatus"], message: string) {
    let targetId = "";
    setManagedServers((current) => {
      const existing = current.find(
        (server) =>
          server.agentBaseUrl === registrationForm.agentBaseUrl ||
          (server.sshHost && server.sshHost === registrationForm.sshHost)
      );

      if (!existing) {
        const nextServer = createServerFromRegistration(registrationForm, status, message);
        targetId = nextServer.id;
        return [...current, nextServer];
      }

      targetId = existing.id;
      return current.map((server) =>
        server.id === existing.id
          ? {
              ...server,
              lastAgentPrepareStatus: status,
              lastAgentPrepareMessage: message,
              status: "setupRequired",
              dockerStatus: status === "needsDocker" ? "needsSetup" : server.dockerStatus
            }
          : server
      );
    });

    if (targetId) {
      setActiveServerId(targetId);
    }
  }

  function upsertPreparedServer(ready: boolean, agentApiReachable: boolean, agentToken = registrationForm.agentToken || undefined) {
    const status: ManagedServer["lastAgentPrepareStatus"] = ready ? "ready" : agentApiReachable ? "failed" : "agentApiBlocked";
    const message = ready ? "Agent 준비 완료" : agentApiReachable ? "Agent 준비 확인 필요" : "Agent API 접근 불가";
    let targetId = "";

    setManagedServers((current) => {
      const existing = current.find(
        (server) =>
          server.agentBaseUrl === registrationForm.agentBaseUrl ||
          (server.sshHost && server.sshHost === registrationForm.sshHost)
      );

      if (!existing) {
        const nextServer = createServerFromRegistration(registrationForm, status, message, agentToken);
        targetId = nextServer.id;
        return [...current, nextServer];
      }

      targetId = existing.id;
      return current.map((server) =>
        server.id === existing.id
          ? {
              ...server,
              lastAgentPrepareStatus: status,
              lastAgentPrepareMessage: message,
              agentToken,
              status: ready ? "connected" : "setupRequired",
              agentStatus: ready ? "connected" : agentApiReachable ? "notInstalled" : "offline",
              dockerStatus: ready ? "ready" : server.dockerStatus
            }
          : server
      );
    });

    if (targetId) {
      setActiveServerId(targetId);
    }

    return targetId;
  }

  function navigateToServerDetail(serverId: string) {
    setActiveServerId(serverId);
    setDetailServerId(serverId);
    window.location.hash = `#/servers/${encodeURIComponent(serverId)}`;
  }

  function navigateToServerList() {
    setDetailServerId("");
    window.location.hash = "#/servers";
  }

  function handleSelectServer(serverId: string) {
    const server = managedServers.find((item) => item.id === serverId);
    navigateToServerDetail(serverId);
    if (server) {
      syncRegistrationFormFromServer(server);
    }
    setContainers([]);
    setDockerStatus(undefined);
    setNoticeKind("info");
    setMessage(server ? `${server.name} 선택됨. SSH 비밀번호만 입력하면 Agent 설치/업데이트를 실행할 수 있습니다.` : "서버 선택됨");
  }

  function syncRegistrationFormFromServer(server: ManagedServer) {
    setRegistrationForm((current) => {
      const nextForm: ServerRegistrationForm = {
        ...current,
      name: server.name,
      targetType: server.targetType,
      connectionMode: server.connectionMode ?? "directSsh",
      agentAccessMode: server.agentAccessMode ?? "direct",
      osType: server.osType,
      sshHost: server.sshHost ?? "",
      sshPort: server.sshPort ?? 22,
      sshUser: server.sshUser ?? "",
      sshAuthMethod: server.sshAuthMethod ?? "password",
      sshKeyPath: server.sshKeyPath ?? "",
      sshPassword: "",
      jumpHost: server.jumpHost ?? "",
      jumpPort: server.jumpPort ?? 22,
      jumpUser: server.jumpUser ?? "",
      jumpAuthMethod: server.jumpAuthMethod ?? "key",
      jumpKeyPath: server.jumpKeyPath ?? "",
      jumpPassword: "",
      haproxyHost: server.haproxyHost ?? server.jumpHost ?? "",
      haproxyPort: server.haproxyPort ?? server.jumpPort ?? 22,
      haproxyUser: server.haproxyUser ?? server.jumpUser ?? "",
      haproxyAuthMethod: server.haproxyAuthMethod ?? server.jumpAuthMethod ?? "key",
      haproxyKeyPath: server.haproxyKeyPath ?? server.jumpKeyPath ?? "",
      haproxyPassword: "",
      haproxyAllowedCidrs: server.haproxyAllowedCidrs ?? "",
      haproxyAgentProxyPort: server.haproxyAgentProxyPort ?? AGENT_PORT,
      agentBaseUrl: server.agentBaseUrl,
      agentToken: server.agentToken ?? "",
      agentDownloadUrl: current.agentDownloadUrl
      };
      return nextForm;
    });
  }

  function handleDeleteServer(serverId: string) {
    const server = managedServers.find((item) => item.id === serverId);
    if (!server) {
      setNoticeKind("error");
      setMessage("삭제할 서버를 찾을 수 없습니다.");
      return;
    }

    if (server.targetType !== "local") {
      setServerDeleteTarget({
        server,
        deleteRemoteAgent: true,
        closeAgentFirewallPort: true,
        sshPassword: "",
        haproxyPassword: "",
        confirmation: ""
      });
      return;
    }

    deleteStoredServer(serverId);
  }

  function deleteStoredServer(serverId: string) {
    const server = managedServers.find((item) => item.id === serverId);
    const nextServers = managedServers.filter((item) => item.id !== serverId);
    setManagedServers(nextServers);

    if (activeServerId === serverId) {
      const nextActiveServer = nextServers[0];
      setActiveServerId(nextActiveServer?.id ?? "");
      setContainers([]);
      setDockerStatus(undefined);
    }

    if (detailServerId === serverId) {
      navigateToServerList();
    }

    setNoticeKind("success");
    setMessage(server ? `${server.name} 삭제됨` : "서버 삭제됨");
  }

  async function handleConfirmDeleteServer() {
    if (!serverDeleteTarget) {
      return;
    }

    if (serverDeleteTarget.confirmation !== serverDeleteTarget.server.name) {
      setNoticeKind("error");
      setMessage("서버 삭제를 진행하려면 서버 이름을 정확히 입력해야 합니다.");
      return;
    }

    if (!serverDeleteTarget.deleteRemoteAgent) {
      deleteStoredServer(serverDeleteTarget.server.id);
      setServerDeleteTarget(undefined);
      return;
    }

    const server = serverDeleteTarget.server;
    if (!server.sshHost || !server.sshUser || !server.sshPort || !server.sshAuthMethod) {
      setNoticeKind("error");
      setMessage("원격 Agent 삭제에는 저장된 SSH 정보가 필요합니다.");
      return;
    }

    if (server.sshAuthMethod === "password" && !serverDeleteTarget.sshPassword) {
      setNoticeKind("error");
      setMessage("원격 Agent 삭제를 위해 SSH 비밀번호를 입력하세요.");
      return;
    }

    if (
      server.connectionMode === "jumpSsh" &&
      server.agentAccessMode === "haproxy" &&
      (server.haproxyAuthMethod ?? "key") === "password" &&
      !serverDeleteTarget.haproxyPassword
    ) {
      setNoticeKind("error");
      setMessage("HAProxy 경유 서버 정리를 위해 경유 서버 SSH 비밀번호를 입력하세요.");
      return;
    }

    try {
      if (server.connectionMode === "jumpSsh" && server.agentAccessMode === "haproxy" && server.haproxyHost && server.haproxyUser) {
        await removeRemoteHaproxyRoutes({
          host: server.haproxyHost,
          port: server.haproxyPort ?? 22,
          username: server.haproxyUser,
          authMethod: server.haproxyAuthMethod ?? "key",
          password: (server.haproxyAuthMethod ?? "key") === "password" ? serverDeleteTarget.haproxyPassword : undefined,
          keyPath: (server.haproxyAuthMethod ?? "key") === "key" ? server.haproxyKeyPath : undefined,
          sudoPassword: (server.haproxyAuthMethod ?? "key") === "password" ? serverDeleteTarget.haproxyPassword : undefined,
          expectedOs: server.osType,
          serverId: buildProxyServerId(server),
          targetHosts: server.sshHost ? [server.sshHost] : undefined,
          closePorts: [
            {
              port: server.haproxyAgentProxyPort ?? AGENT_PORT,
              protocol: "tcp",
              allowedCidrs: server.haproxyAllowedCidrs
            }
          ]
        });
      }

      const result = await removeRemoteAgent({
        host: server.sshHost,
        port: server.sshPort,
        username: server.sshUser,
        authMethod: server.sshAuthMethod,
        password: server.sshAuthMethod === "password" ? serverDeleteTarget.sshPassword : undefined,
        keyPath: server.sshAuthMethod === "key" ? server.sshKeyPath : undefined,
        expectedOs: server.osType,
        closeAgentFirewallPort: serverDeleteTarget.closeAgentFirewallPort
      });

      if (!result.removed) {
        setServerDeleteTarget({ ...serverDeleteTarget, lastError: "원격 Agent 파일 또는 서비스가 남아 있습니다." });
        setNoticeKind("error");
        setMessage("원격 Agent 정리가 완료되지 않아 앱 등록 정보를 삭제하지 않았습니다.");
        return;
      }

      deleteStoredServer(server.id);
      setServerDeleteTarget(undefined);
      setNoticeKind("success");
      setMessage(
        result.firewallClosed
          ? `${server.name} Agent와 18080 방화벽 규칙을 정리하고 등록 정보를 삭제했습니다.`
          : `${server.name} Agent를 정리하고 등록 정보를 삭제했습니다. 외부 방화벽의 18080 규칙은 별도로 확인하세요.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "원격 Agent 삭제 실패";
      setServerDeleteTarget({ ...serverDeleteTarget, lastError: message });
      setNoticeKind("error");
      setMessage("원격 Agent 정리가 실패해 앱 등록 정보를 삭제하지 않았습니다.");
    }
  }

  function isLoopbackAgentUrl(agentBaseUrl: string) {
    try {
      const url = new URL(agentBaseUrl);
      return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    } catch {
      return false;
    }
  }

  function updateServerStatus(serverId: string, status: DockerStatusResponse, isConnected: boolean) {
    setManagedServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? {
              ...server,
              status: isConnected ? "connected" : "setupRequired",
              agentStatus: isConnected ? "connected" : "offline",
              dockerStatus: status.mode === "cli" && status.agentVersion === EXPECTED_AGENT_VERSION ? "ready" : "needsSetup"
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
      <ToastViewport messages={toasts} onDismiss={dismissToast} />
      <Topbar
        actionLabel="서버 추가"
        description={
          isServerDetailRoute
            ? "선택한 서버에서 게임 서버를 시작, 중지, 삭제할 수 있습니다."
            : "등록된 서버를 선택하고 한단에서 게임 서버를 관리할 수 있습니다."
        }
        onAction={() => setServerRegistrationOpen(true)}
        title={isServerDetailRoute && activeServer ? activeServer.name : "내 서버"}
      />

      {!isServerDetailRoute && managedServers.length === 0 ? (
        <article className="panel emptyStatePanel">
          <h2>아직 등록된 서버가 없어요</h2>
          <p>서버를 등록하면 버튼 클릭 만으로 게임 서버를 시작하고 관리할 수 있습니다. 지금 PC, 클라우드 서버 등 어떤 환경이든 쉽게 연결할 수 있습니다.</p>
          <button className="primaryButton" onClick={() => setServerRegistrationOpen(true)} type="button">
            첫 번째 서버 추가하기
          </button>
        </article>
      ) : null}

      {!isServerDetailRoute && managedServers.length > 0 ? (
        <section className="modeGrid" aria-label="등록된 서버">
          {managedServers.map((server) => (
            <ServerCard
              isSelected={server.id === activeServerId}
              key={server.id}
              onDelete={handleDeleteServer}
              onSelect={handleSelectServer}
              server={server}
            />
          ))}
        </section>
      ) : null}
      {isServerDetailRoute && activeServer ? (
        <ServerDetailView
          activeServer={activeServer}
          containers={containers}
          createReadiness={createReadiness}
          dockerStatus={dockerStatus}
          isServerDetailRoute={isServerDetailRoute}
          message={message}
          pendingAction={pendingAction}
          pendingFirewallOpen={pendingFirewallOpen}
          shouldWarnAgentExposure={shouldWarnAgentExposure}
          onBackToList={navigateToServerList}
          onCheckAgent={handleCheckAgent}
          onOpenFirewallPort={handleOpenFirewallPort}
          onOpenGameCreate={() => setGameCreateOpen(true)}
          onOpenConsole={setConsoleContainer}
          onRefreshContainers={refreshContainers}
          onRequestAgentUpdate={handleRequestAgentUpdate}
          onRequestContainerAction={handleRequestContainerAction}
          onRunContainerAction={handleContainerAction}
          onTestSSH={handleTestSSHInput}
        />
      ) : null}

      {gameCreateOpen ? (
        <AppModal onClose={() => setGameCreateOpen(false)} title="게임 서버 추가">
          <ServerCreatePanel
            disabled={!createReadiness.canCreate}
            form={createForm}
            onChange={setCreateForm}
            onSubmit={handleCreateServer}
          />
        </AppModal>
      ) : null}

      {consoleContainer && activeServer ? (
        <AppModal onClose={() => setConsoleContainer(undefined)} title={`${consoleContainer.name} 콘솔`}>
          <ContainerConsolePanel
            agentBaseUrl={activeServer.agentBaseUrl}
            agentToken={activeServer.agentToken}
            container={consoleContainer}
            serverName={activeServer.name}
          />
        </AppModal>
      ) : null}
      {createConfirmModalOpen ? (
        <CreateServerConfirmModal
          activeServer={activeServer}
          form={createForm}
          sudoPassword={createSudoPassword}
          volumePath={buildVolumePath(createForm.gameTemplateId, createForm.serverName)}
          onChangeSudoPassword={setCreateSudoPassword}
          onClose={() => setCreateConfirmModalOpen(false)}
          onConfirm={handleConfirmCreateServer}
        />
      ) : null}

      {pendingFirewallOpen ? (
        <article className="confirmPanel">
          <h2>sudo 관리자 권한 확인</h2>
          <p>
            Agent 포트 설정은 SSH 비밀번호를 sudo 입력으로 재사용해 서버 내부 방화벽을 변경합니다.
            AWS 보안 그룹, 클라우드 방화벽, 공유기 포트포워딩은 별도로 열어야 할 수 있습니다.
          </p>
        </article>
      ) : null}

      {serverRegistrationOpen ? (
        <AppModal onClose={() => setServerRegistrationOpen(false)} title="서버 추가">
          <ServerRegistrationPanel
            form={registrationForm}
            isFirewallConfirming={pendingFirewallOpen}
            pendingAction={pendingRegistrationAction}
            onChange={handleRegistrationFormChange}
            onOpenFirewallPort={handleOpenFirewallPort}
            onPrepareAgent={handlePrepareAgent}
            onUpdateAgent={handleRequestAgentUpdate}
            onSubmit={handleRegisterServer}
            onTestSSH={handleTestSSHInput}
          />
        </AppModal>
      ) : null}

      {haproxyInstallModalOpen ? (
        <AppModal onClose={() => setHaproxyInstallModalOpen(false)} title="HAProxy 설치">
          <p className="helperText">
            외부망 경유 노드에서 HAProxy를 찾지 못했습니다. OS와 패키지 매니저를 감지한 뒤 HAProxy 설치를 시도합니다.
          </p>
          <label className="fieldGroup">
            <span>sudo password</span>
            <input
              autoFocus
              className="textInput"
              onChange={(event) => setHaproxyInstallPassword(event.target.value)}
              type="password"
              value={haproxyInstallPassword}
            />
          </label>
          <div className="modalActions">
            <button className="secondaryButton" onClick={() => setHaproxyInstallModalOpen(false)} type="button">
              취소
            </button>
            <button className="primaryButton" disabled={pendingRegistrationAction === "ssh"} onClick={handleConfirmHaproxyInstall} type="button">
              {pendingRegistrationAction === "ssh" ? "설치 중" : "설치"}
            </button>
          </div>
        </AppModal>
      ) : null}
      {agentUpdateModalOpen ? (
        <AgentUpdateModal
          password={agentUpdatePassword}
          onChangePassword={setAgentUpdatePassword}
          onClose={() => setAgentUpdateModalOpen(false)}
          onConfirm={handleConfirmAgentUpdate}
        />
      ) : null}

      {dockerGuide ? <DockerInstallGuide issue={dockerGuide.issue} osType={dockerGuide.osType} /> : null}
      {serverDeleteTarget ? (
        <ServerDeleteModal
          target={serverDeleteTarget}
          onChange={setServerDeleteTarget}
          onClose={() => setServerDeleteTarget(undefined)}
          onConfirm={handleConfirmDeleteServer}
        />
      ) : null}
      {deleteTarget ? (
        <ContainerDeleteModal
          target={deleteTarget}
          onChange={setDeleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onBack={() => setDeleteTarget({ ...deleteTarget, step: "scope" })}
          onNext={handleNextDeleteStep}
          onConfirm={handleConfirmDeleteContainer}
        />
      ) : null}

    </>
  );
}
