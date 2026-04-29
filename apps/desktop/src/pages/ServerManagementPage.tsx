import { useEffect, useState } from "react";
import { AgentStatusPanel } from "../components/AgentStatusPanel";
import { AppModal } from "../components/AppModal";
import { ContainerTable } from "../components/ContainerTable";
import { DockerInstallGuide } from "../components/DockerInstallGuide";
import { ServerCreatePanel } from "../components/ServerCreatePanel";
import { ServerCreateReadinessPanel } from "../components/ServerCreateReadinessPanel";
import { ServerCard } from "../components/ServerCard";
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
import { prepareRemoteAgent } from "../services/agentBootstrapClient";
import { closeRemoteFirewallPort, openRemoteFirewallPort } from "../services/firewallClient";
import { loadStoredServers, saveStoredServers } from "../services/serverStorage";
import { testSSHConnection } from "../services/sshClient";
import type { ContainerActionRequest, ContainerSummaryResponse, DockerStatusResponse } from "../types/api";
import type {
  ContainerSummary,
  DockerIssue,
  ManagedServer,
  ServerCreateForm,
  ServerCreateReadiness,
  FirewallClosePortRequest,
  FirewallOpenPortRequest,
  ServerOsType,
  ServerRegistrationForm
} from "../types/server";

type NoticeKind = "info" | "success" | "warning" | "error";
type DeleteTarget = {
  container: ContainerSummary;
  step: "scope" | "firewall";
  deleteData: boolean;
  confirmation: string;
  firewallMode: "keep" | "deleteAllow" | "deny";
  firewallPassword: string;
};

const AGENT_PORT = 18080;
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
  const [registrationForm, setRegistrationForm] = useState<ServerRegistrationForm>({
    name: "새 원격 서버",
    targetType: "remote",
    osType: "linux-ubuntu",
    sshHost: "",
    sshPort: 22,
    sshUser: "",
    sshAuthMethod: "key",
    sshKeyPath: "",
    sshPassword: "",
    agentBaseUrl: "http://127.0.0.1:18080",
    agentToken: "",
    agentDownloadUrl: "https://github.com/daewook0401/remote-game-server-app/releases/latest/download/agent-linux-amd64"
  });
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<ContainerActionRequest>();
  const [createConfirmModalOpen, setCreateConfirmModalOpen] = useState(false);
  const [createSudoPassword, setCreateSudoPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>();
  const [pendingFirewallOpen, setPendingFirewallOpen] = useState(false);
  const [agentUpdateModalOpen, setAgentUpdateModalOpen] = useState(false);
  const [agentUpdatePassword, setAgentUpdatePassword] = useState("");
  const [serverRegistrationOpen, setServerRegistrationOpen] = useState(false);
  const [gameCreateOpen, setGameCreateOpen] = useState(false);
  const [detailServerId, setDetailServerId] = useState(() => readServerDetailIdFromHash());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dockerGuide, setDockerGuide] = useState<{ issue: DockerIssue; osType: ServerOsType }>();
  const detailServer = detailServerId ? managedServers.find((server) => server.id === detailServerId) : undefined;
  const activeServer = detailServer ?? managedServers.find((server) => server.id === activeServerId) ?? managedServers[0];
  const isServerDetailRoute = Boolean(detailServer);
  const activeAgentBaseUrl = activeServer?.agentBaseUrl;
  const activeAgentToken = activeServer?.agentToken;
  const isCliMode = dockerStatus?.mode === "cli";
  const isAgentVersionCurrent = dockerStatus?.agentVersion === EXPECTED_AGENT_VERSION;
  const createReadiness = buildCreateReadiness();

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
        step: "scope",
        deleteData: false,
        confirmation: "",
        firewallMode: "keep",
        firewallPassword: ""
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
      if (deleteTarget.firewallMode !== "keep") {
        const firewallRequest = buildCloseFirewallRequest(
          activeServer,
          deleteTarget.container.port,
          deleteTarget.firewallPassword,
          deleteTarget.firewallMode
        );
        if (!firewallRequest) {
          setNoticeKind("error");
          setMessage("방화벽 규칙을 정리하려면 선택된 서버의 SSH 정보와 sudo 비밀번호가 필요합니다.");
          return;
        }

        await closeRemoteFirewallPort(firewallRequest);
      }

      await applyContainerAction({
        containerId: deleteTarget.container.id,
        action: "delete",
        deleteData: deleteTarget.deleteData,
        volumePath: deleteTarget.container.volumePath
      }, activeAgentBaseUrl, activeAgentToken);
      setContainers((current) => current.filter((item) => item.id !== deleteTarget.container.id));
      setDeleteTarget(undefined);
      setNoticeKind("success");
      setMessage(
        deleteTarget.deleteData
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

  async function handleCheckAgent() {
    if (!activeServer) {
      setNoticeKind("error");
      setMessage("서버를 먼저 선택해야 합니다.");
      return;
    }

    try {
      const status = await getDockerStatus(activeServer.agentBaseUrl, activeServer.agentToken);
      setDockerStatus(status);
      const managedContainers = await listManagedContainers(activeServer.agentBaseUrl, activeServer.agentToken);
      setContainers(managedContainers);
      updateServerStatus(activeServer.id, status, true);
      const versionCurrent = status.agentVersion === EXPECTED_AGENT_VERSION;
      setNoticeKind(versionCurrent && status.mode === "cli" ? "success" : "warning");
      setMessage(
        versionCurrent
          ? `${activeServer.name} Agent 상태 확인 완료: ${status.mode} mode, 컨테이너 ${managedContainers.length}개`
          : `${activeServer.name} Agent 업데이트 필요: 현재 ${status.agentVersion ?? "확인 불가"}, 필요 ${EXPECTED_AGENT_VERSION}`
      );
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
      const managedContainers = await listManagedContainers(activeServer.agentBaseUrl, activeServer.agentToken);
      setContainers(managedContainers);
      setNoticeKind("success");
      setMessage(`${activeServer.name} Docker 컨테이너 목록 갱신 완료: ${managedContainers.length}개`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 목록 조회 실패");
    }
  }

  function handleRegisterServer() {
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

    const nextServer: ManagedServer = {
      id: `${registrationForm.targetType}-${Date.now()}`,
      name: registrationForm.name,
      targetType: registrationForm.targetType,
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
      agentToken: registrationForm.agentToken || undefined,
      status: "setupRequired",
      agentStatus: "notInstalled",
      dockerStatus: "unknown"
    };

    setManagedServers((current) => [...current, nextServer]);
    navigateToServerDetail(nextServer.id);
    setContainers([]);
    setDockerStatus(undefined);
    setServerRegistrationOpen(false);
    setNoticeKind("success");
    setMessage(`${nextServer.name} 등록 완료. Agent 확인을 눌러 연결 상태를 확인하세요.`);
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
      setNoticeKind("info");
      setMessage("SSH 접속과 운영체제 확인을 진행합니다.");
      const result = await testSSHConnection({
        host: registrationForm.sshHost,
        port: registrationForm.sshPort,
        username: registrationForm.sshUser,
        authMethod: registrationForm.sshAuthMethod,
        password: registrationForm.sshAuthMethod === "password" ? registrationForm.sshPassword : undefined,
        keyPath: registrationForm.sshAuthMethod === "key" ? registrationForm.sshKeyPath : undefined,
        expectedOs: registrationForm.osType
      });

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
  }

  async function handlePrepareAgent(passwordOverride?: string) {
    const sshPassword = passwordOverride ?? registrationForm.sshPassword;
    if (registrationForm.targetType === "local") {
      setNoticeKind("info");
      setMessage("로컬 서버는 Agent 준비가 필요하지 않습니다.");
      return;
    }

    if (registrationForm.osType === "windows" || registrationForm.osType === "macos") {
      setNoticeKind("error");
      setMessage("현재 Agent 자동 준비는 Linux 서버만 지원합니다.");
      return;
    }

    if (!registrationForm.sshHost || !registrationForm.sshUser || !registrationForm.sshPort) {
      setNoticeKind("error");
      setMessage("SSH host, port, user를 입력해야 합니다.");
      return;
    }

    if (!registrationForm.agentDownloadUrl) {
      setNoticeKind("error");
      setMessage("Linux Agent 다운로드 URL이 필요합니다.");
      return;
    }

    if (registrationForm.sshAuthMethod === "password" && !sshPassword) {
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
      setNoticeKind("info");
      setMessage("SSH로 Linux Agent 준비를 진행합니다.");
      const result = await prepareRemoteAgent({
        host: registrationForm.sshHost,
        port: registrationForm.sshPort,
        username: registrationForm.sshUser,
        authMethod: registrationForm.sshAuthMethod,
        password: registrationForm.sshAuthMethod === "password" ? sshPassword : undefined,
        keyPath: registrationForm.sshAuthMethod === "key" ? registrationForm.sshKeyPath : undefined,
        expectedOs: registrationForm.osType,
        agentToken: registrationForm.agentToken || undefined,
        downloadUrl: registrationForm.agentDownloadUrl
      });

      let agentApiReachable = false;
      let preparedStatus: DockerStatusResponse | undefined;
      try {
        preparedStatus = await getDockerStatus(registrationForm.agentBaseUrl, registrationForm.agentToken || undefined);
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
      const preparedServer = upsertPreparedServer(ready, agentApiReachable);
      setNoticeKind(ready ? "success" : "warning");
      setMessage(
        [
          `Agent ${ready ? "업데이트 완료" : result.installed ? "설치됨, 확인 필요" : "설치 실패"}`,
          `실행 ${result.started ? "성공" : "확인 실패"}`,
          `포트 ${result.agentPortOpen ? "열림" : "닫힘"}`,
          `API ${agentApiReachable ? "접근 가능" : "접근 불가"}`,
          `버전 ${preparedStatus?.agentVersion ?? "확인 불가"} / ${EXPECTED_AGENT_VERSION}`,
          `Docker ${preparedStatus?.mode ?? "확인 불가"}`,
          `카드 ${preparedServer ? "반영됨" : "미반영"}`
        ].join(" · ")
      );
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "Agent 준비 실패");
    }
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

    const request = buildPasswordFirewallRequest(server, createForm.externalPort, sudoPassword);
    if (!request) {
      throw new Error("게임 포트를 자동으로 열려면 SSH 비밀번호를 입력해야 합니다. 비밀번호는 sudo 입력으로만 사용하고 저장하지 않습니다.");
    }

    await openRemoteFirewallPort(request);
  }

  function buildPasswordFirewallRequest(server: ManagedServer, firewallPort: number, sudoPassword?: string): FirewallOpenPortRequest | undefined {
    if (!server.sshHost || !server.sshUser) {
      return undefined;
    }

    const sameHost = registrationForm.sshHost === server.sshHost;
    const sameUser = registrationForm.sshUser === server.sshUser;
    const password = sudoPassword || registrationForm.sshPassword;
    if (!sameHost || !sameUser || !password) {
      return undefined;
    }

    return {
      host: server.sshHost,
      port: server.sshPort ?? registrationForm.sshPort,
      username: server.sshUser,
      authMethod: "password",
      password,
      expectedOs: server.osType,
      sudoPassword: password,
      protocol: "tcp",
      firewallPort
    };
  }

  function buildCloseFirewallRequest(
    server: ManagedServer | undefined,
    firewallPort: number,
    sudoPassword: string,
    closeMode: FirewallClosePortRequest["closeMode"]
  ): FirewallClosePortRequest | undefined {
    if (!server || server.targetType === "local" || !server.sshHost || !server.sshUser || !sudoPassword || !firewallPort) {
      return undefined;
    }

    return {
      host: server.sshHost,
      port: server.sshPort ?? registrationForm.sshPort,
      username: server.sshUser,
      authMethod: "password",
      password: sudoPassword,
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

  function buildAgentBaseUrl(form: ServerRegistrationForm) {
    if (form.targetType === "local") {
      return form.agentBaseUrl || `http://127.0.0.1:${AGENT_PORT}`;
    }

    return form.sshHost ? `http://${form.sshHost}:${AGENT_PORT}` : "";
  }

  function handleRegistrationFormChange(nextForm: ServerRegistrationForm) {
    setRegistrationForm({
      ...nextForm,
      agentBaseUrl: buildAgentBaseUrl(nextForm)
    });
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

  function buildServerFromRegistration(status: ManagedServer["lastAgentPrepareStatus"], message: string): ManagedServer {
    return {
      id: `${registrationForm.targetType}-${Date.now()}`,
      name: registrationForm.name,
      targetType: registrationForm.targetType,
      osType: registrationForm.osType,
      host:
        registrationForm.targetType === "local"
          ? "localhost"
          : `${registrationForm.sshUser}@${registrationForm.sshHost}:${registrationForm.sshPort}`,
      agentBaseUrl: buildAgentBaseUrl(registrationForm),
      sshHost: registrationForm.sshHost || undefined,
      sshPort: registrationForm.targetType === "local" ? undefined : registrationForm.sshPort,
      sshUser: registrationForm.sshUser || undefined,
      sshAuthMethod: registrationForm.targetType === "local" ? undefined : registrationForm.sshAuthMethod,
      sshKeyPath: registrationForm.sshKeyPath || undefined,
      agentToken: registrationForm.agentToken || undefined,
      lastAgentPrepareStatus: status,
      lastAgentPrepareMessage: message,
      status: status === "ready" ? "connected" : "setupRequired",
      agentStatus: status === "ready" ? "connected" : status === "agentApiBlocked" ? "offline" : "notInstalled",
      dockerStatus: status === "needsDocker" ? "needsSetup" : "ready"
    };
  }

  function buildCreateReadiness(): ServerCreateReadiness {
    const selectedServer = Boolean(activeServer);
    const agentChecked = Boolean(dockerStatus?.available);
    const dockerReady = dockerStatus?.mode === "cli";
    const agentVersionReady = isAgentVersionCurrent;
    const hasServerName = createForm.serverName.trim().length > 0;
    const validPorts = createForm.internalPort > 0 && createForm.externalPort > 0;
    const eulaAccepted = createForm.eulaAccepted;
    const targetReady = activeServer?.targetType === "local" || activeServer?.agentStatus === "connected";

    const items = [
      { label: "서버 선택", ok: selectedServer },
      { label: "Agent 상태 확인", ok: agentChecked },
      { label: `Agent 버전 ${EXPECTED_AGENT_VERSION}`, ok: agentVersionReady },
      { label: "실제 Docker mode", ok: dockerReady },
      { label: "원격/클라우드 Agent 연결", ok: Boolean(targetReady) },
      { label: "서버 이름 입력", ok: hasServerName },
      { label: "포트 입력", ok: validPorts },
      { label: "Minecraft EULA 동의", ok: eulaAccepted }
    ];

    const canCreate =
      selectedServer && agentChecked && agentVersionReady && dockerReady && hasServerName && validPorts && eulaAccepted && Boolean(targetReady);

    if (!selectedServer) {
      return { canCreate: false, items, message: "서버를 먼저 선택하세요." };
    }

    if (!agentChecked) {
      return { canCreate: false, items, message: "Agent 상태 확인을 먼저 실행하세요." };
    }

    if (!agentVersionReady) {
      return { canCreate: false, items, message: "Agent 버전이 다릅니다. Agent 설치/업데이트를 실행하세요." };
    }

    if (!dockerReady) {
      return { canCreate: false, items, message: "실제 Docker CLI mode가 확인되어야 Minecraft 서버를 생성할 수 있습니다." };
    }

    if (!targetReady) {
      return { canCreate: false, items, message: "원격/클라우드 서버는 Agent 준비 또는 Agent 확인이 필요합니다." };
    }

    if (!hasServerName || !validPorts || !eulaAccepted) {
      return { canCreate: false, items, message: "서버 이름, 포트, EULA 동의를 확인하세요." };
    }

    return { canCreate, items, message: "서버 생성을 진행할 수 있습니다." };
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

  function dockerMessage(issue: DockerIssue) {
    if (issue === "none") return "준비됨";
    if (issue === "notInstalled") return "미설치";
    if (issue === "daemonStopped") return "daemon 미실행";
    if (issue === "permissionDenied") return "권한 부족";
    return "확인 필요";
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
        const nextServer = buildServerFromRegistration(status, message);
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

  function upsertPreparedServer(ready: boolean, agentApiReachable: boolean) {
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
        const nextServer = buildServerFromRegistration(status, message);
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

    return true;
  }

  async function handleCheckServer(serverId: string) {
    setActiveServerId(serverId);
    const server = managedServers.find((item) => item.id === serverId);
    if (!server) {
      return;
    }

    try {
      const status = await getDockerStatus(server.agentBaseUrl, server.agentToken);
      const managedContainers = await listManagedContainers(server.agentBaseUrl, server.agentToken);
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
      osType: server.osType,
      sshHost: server.sshHost ?? "",
      sshPort: server.sshPort ?? 22,
      sshUser: server.sshUser ?? "",
      sshAuthMethod: server.sshAuthMethod ?? "password",
      sshKeyPath: server.sshKeyPath ?? "",
      sshPassword: "",
        agentBaseUrl: server.sshHost ? `http://${server.sshHost}:${AGENT_PORT}` : server.agentBaseUrl,
      agentToken: server.agentToken ?? "",
      agentDownloadUrl: current.agentDownloadUrl
      };
      return nextForm;
    });
  }

  function handleDeleteServer(serverId: string) {
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
            ? "선택한 서버 안에서 Agent, Docker, 게임 서버를 관리합니다."
            : "먼저 서버를 선택하고, 들어가기 버튼으로 서버 관리 화면에 접근합니다."
        }
        onAction={() => setServerRegistrationOpen(true)}
        title={isServerDetailRoute && activeServer ? activeServer.name : "서버 선택"}
      />

      {!isServerDetailRoute && managedServers.length === 0 ? (
        <article className="panel emptyStatePanel">
          <h2>등록된 서버가 없습니다.</h2>
          <p>처음 실행했다면 서버를 먼저 추가하세요. 지금 PC, SSH 서버, 클라우드 서버 중 하나를 등록할 수 있습니다.</p>
          <button className="primaryButton" onClick={() => setServerRegistrationOpen(true)} type="button">
            서버 생성
          </button>
        </article>
      ) : null}

      {!isServerDetailRoute && managedServers.length > 0 ? (
        <section className="modeGrid" aria-label="등록된 서버">
          {managedServers.map((server) => (
            <ServerCard
              isSelected={server.id === activeServerId}
              key={server.id}
              onCheck={handleCheckServer}
              onDelete={handleDeleteServer}
              onSelect={handleSelectServer}
              server={server}
            />
          ))}
        </section>
      ) : null}

      {isServerDetailRoute && activeServer ? (
        <>
          <article className="contextPanel">
            <span>선택된 서버</span>
            <strong>{activeServer.name}</strong>
            <code>{activeServer.agentBaseUrl}</code>
            <button className="secondaryButton compactButton" onClick={navigateToServerList} type="button">
              목록으로
            </button>
          </article>

          <section className="panelGrid">
            <AgentStatusPanel message={message} status={dockerStatus} />
            <article className="panel">
              <div className="panelHeader">
                <h2>서버 준비</h2>
              </div>
              <div className="formActions">
                <button className="secondaryButton fullWidthButton" onClick={handleCheckAgent} type="button">
                  Agent 상태 확인
                </button>
                {activeServer.targetType !== "local" ? (
                  <>
                    <button className="secondaryButton fullWidthButton" onClick={handleTestSSHInput} type="button">
                      SSH 확인
                    </button>
                    <button className="primaryButton fullWidthButton" onClick={() => handlePrepareAgent()} type="button">
                      Agent 설치
                    </button>
                    <button className="secondaryButton fullWidthButton" onClick={handleRequestAgentUpdate} type="button">
                      Agent 업데이트
                    </button>
                    <button
                      className={pendingFirewallOpen ? "secondaryButton fullWidthButton warningButton" : "secondaryButton fullWidthButton"}
                      onClick={handleOpenFirewallPort}
                      type="button"
                    >
                      {pendingFirewallOpen ? "sudo 허용 후 Agent 포트 열기" : "Agent 포트 개방"}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          </section>

          <ServerCreateReadinessPanel readiness={createReadiness} />

          <ContainerTable
            containers={containers}
            onAction={handleContainerAction}
            onAddContainer={() => setGameCreateOpen(true)}
            onRefreshContainers={refreshContainers}
            onRequestAction={handleRequestContainerAction}
            pendingAction={pendingAction}
          />
        </>
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

      {createConfirmModalOpen ? (
        <AppModal onClose={() => setCreateConfirmModalOpen(false)} title="게임 서버 생성">
          <p className="helperText">
            Docker 컨테이너를 만들고 외부 공개 포트 {createForm.externalPort}/tcp를 엽니다. 원격 서버에서는 sudo 권한이 필요하며
            입력한 SSH 비밀번호는 이번 작업에만 사용하고 저장하지 않습니다.
          </p>
          <dl className="detailList">
            <div>
              <dt>게임</dt>
              <dd>{createForm.gameTemplateId === "minecraft-java" ? "Minecraft Java" : createForm.gameTemplateId}</dd>
            </div>
            <div>
              <dt>포트</dt>
              <dd>{createForm.externalPort} → {createForm.internalPort}</dd>
            </div>
            <div>
              <dt>볼륨</dt>
              <dd>{buildVolumePath(createForm.gameTemplateId, createForm.serverName)}</dd>
            </div>
          </dl>
          {activeServer?.targetType !== "local" ? (
            <label className="fieldGroup">
              <span>SSH password</span>
              <input
                autoFocus
                className="textInput"
                onChange={(event) => setCreateSudoPassword(event.target.value)}
                type="password"
                value={createSudoPassword}
              />
            </label>
          ) : null}
          <div className="modalActions">
            <button className="secondaryButton" onClick={() => setCreateConfirmModalOpen(false)} type="button">
              취소
            </button>
            <button className="primaryButton" onClick={handleConfirmCreateServer} type="button">
              생성
            </button>
          </div>
        </AppModal>
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
            onChange={handleRegistrationFormChange}
            onOpenFirewallPort={handleOpenFirewallPort}
            onPrepareAgent={handlePrepareAgent}
            onUpdateAgent={handleRequestAgentUpdate}
            onSubmit={handleRegisterServer}
            onTestSSH={handleTestSSHInput}
          />
        </AppModal>
      ) : null}

      {agentUpdateModalOpen ? (
        <AppModal onClose={() => setAgentUpdateModalOpen(false)} title="Agent 업데이트">
          <p className="helperText">
            저장된 SSH 서버에 접속해 기존 Agent를 중지하고 새 Agent로 교체합니다. 게임 서버 정보 파일은 유지됩니다.
          </p>
          <label className="fieldGroup">
            <span>SSH password</span>
            <input
              autoFocus
              className="textInput"
              onChange={(event) => setAgentUpdatePassword(event.target.value)}
              type="password"
              value={agentUpdatePassword}
            />
          </label>
          <div className="modalActions">
            <button className="secondaryButton" onClick={() => setAgentUpdateModalOpen(false)} type="button">
              취소
            </button>
            <button className="primaryButton" onClick={handleConfirmAgentUpdate} type="button">
              업데이트
            </button>
          </div>
        </AppModal>
      ) : null}

      {dockerGuide ? <DockerInstallGuide issue={dockerGuide.issue} osType={dockerGuide.osType} /> : null}

      {deleteTarget ? (
        <AppModal
          onClose={() => setDeleteTarget(undefined)}
          title={deleteTarget.step === "scope" ? "게임 서버 삭제" : "방화벽 포트 정리"}
        >
          {deleteTarget.step === "scope" ? (
            <>
              <p className="helperText">
                먼저 삭제 범위를 선택하세요. 컨테이너만 삭제하면 맵 데이터와 설정 파일은 서버 볼륨에 남습니다.
              </p>
              <label className="checkRow">
                <input
                  checked={!deleteTarget.deleteData}
                  onChange={() => setDeleteTarget({ ...deleteTarget, deleteData: false, confirmation: "" })}
                  type="radio"
                />
                컨테이너만 삭제하고 맵 데이터는 유지
              </label>
              <label className="checkRow">
                <input
                  checked={deleteTarget.deleteData}
                  onChange={() => setDeleteTarget({ ...deleteTarget, deleteData: true })}
                  type="radio"
                />
                전체 데이터 삭제
              </label>
              {deleteTarget.deleteData ? (
                <div className="dangerChoice">
                  <strong>맵 데이터, 설정, 로그가 모두 사라집니다.</strong>
                  <span>계속하려면 서버 이름 `{deleteTarget.container.name}`을 그대로 입력하세요.</span>
                  <input
                    className="textInput"
                    onChange={(event) => setDeleteTarget({ ...deleteTarget, confirmation: event.target.value })}
                    value={deleteTarget.confirmation}
                  />
                </div>
              ) : null}
              <div className="modalActions">
                <button className="secondaryButton" onClick={() => setDeleteTarget(undefined)} type="button">
                  취소
                </button>
                <button className="primaryButton" onClick={handleNextDeleteStep} type="button">
                  다음
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="helperText">
                마지막으로 게임 포트 방화벽 규칙을 어떻게 처리할지 선택하세요. 방화벽 변경에는 SSH 비밀번호와 sudo 권한이 필요할 수 있습니다.
              </p>
              <div className="dangerChoice">
                <strong>방화벽 포트 정리</strong>
                <label className="checkRow">
                  <input
                    checked={deleteTarget.firewallMode === "keep"}
                    onChange={() => setDeleteTarget({ ...deleteTarget, firewallMode: "keep", firewallPassword: "" })}
                    type="radio"
                  />
                  방화벽은 그대로 둠
                </label>
                <label className="checkRow">
                  <input
                    checked={deleteTarget.firewallMode === "deleteAllow"}
                    onChange={() => setDeleteTarget({ ...deleteTarget, firewallMode: "deleteAllow" })}
                    type="radio"
                  />
                  열어둔 허용 규칙 삭제
                </label>
                <label className="checkRow">
                  <input
                    checked={deleteTarget.firewallMode === "deny"}
                    onChange={() => setDeleteTarget({ ...deleteTarget, firewallMode: "deny" })}
                    type="radio"
                  />
                  차단 규칙 추가
                </label>
                {deleteTarget.firewallMode !== "keep" ? (
                  <label className="fieldGroup">
                    <span>SSH password</span>
                    <input
                      autoFocus
                      className="textInput"
                      onChange={(event) => setDeleteTarget({ ...deleteTarget, firewallPassword: event.target.value })}
                      type="password"
                      value={deleteTarget.firewallPassword}
                    />
                  </label>
                ) : null}
              </div>
              <div className="modalActions">
                <button
                  className="secondaryButton"
                  onClick={() => setDeleteTarget({ ...deleteTarget, step: "scope" })}
                  type="button"
                >
                  이전
                </button>
                <button className="secondaryButton warningButton" onClick={handleConfirmDeleteContainer} type="button">
                  삭제
                </button>
              </div>
            </>
          )}
        </AppModal>
      ) : null}

    </>
  );
}
