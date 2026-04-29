import type {
  HaproxyApplyRequest,
  HaproxyRemoveRequest,
  HaproxySshRequest,
  ManagedServer,
  ServerRegistrationForm
} from "../types/server";

export const AGENT_PORT = 18080;

const DOCUMENTATION_CIDR_PREFIXES = ["192.0.2.", "198.51.100.", "203.0.113."];

export function isDocumentationCidrs(value?: string) {
  return Boolean(
    value
      ?.split(",")
      .map((cidr) => cidr.trim())
      .filter(Boolean)
      .some((cidr) => DOCUMENTATION_CIDR_PREFIXES.some((prefix) => cidr.startsWith(prefix)))
  );
}

function assertUsableAllowedCidrs(value?: string) {
  if (isDocumentationCidrs(value)) {
    throw new Error("허용 IP/CIDR에 예시용 IP가 입력되어 있습니다. 비워두면 전체 허용이고, 제한하려면 실제 접속 PC의 공인 IP/32를 입력하세요.");
  }
}

export function createDefaultRegistrationForm(): ServerRegistrationForm {
  return {
    name: "원격 서버",
    targetType: "remote",
    connectionMode: "directSsh",
    agentAccessMode: "direct",
    osType: "linux-ubuntu",
    sshHost: "",
    sshPort: 22,
    sshUser: "",
    sshAuthMethod: "key",
    sshKeyPath: "",
    sshPassword: "",
    jumpHost: "",
    jumpPort: 22,
    jumpUser: "",
    jumpAuthMethod: "key",
    jumpKeyPath: "",
    jumpPassword: "",
    haproxyHost: "",
    haproxyPort: 22,
    haproxyUser: "",
    haproxyAuthMethod: "key",
    haproxyKeyPath: "",
    haproxyPassword: "",
    haproxyAllowedCidrs: "",
    haproxyAgentProxyPort: AGENT_PORT,
    agentBaseUrl: `http://127.0.0.1:${AGENT_PORT}`,
    agentToken: "",
    agentDownloadUrl: "https://github.com/daewook0401/OpenServerHub/releases/latest/download/agent-linux-amd64"
  };
}

export function buildTargetSshRequest(form: ServerRegistrationForm, passwordOverride?: string) {
  return {
    host: form.sshHost,
    port: form.sshPort,
    username: form.sshUser,
    authMethod: form.sshAuthMethod,
    password: form.sshAuthMethod === "password" ? passwordOverride ?? form.sshPassword : undefined,
    keyPath: form.sshAuthMethod === "key" ? form.sshKeyPath : undefined,
    connectionMode: form.connectionMode,
    jumpHost: form.connectionMode === "jumpSsh" ? form.haproxyHost : undefined,
    jumpPort: form.connectionMode === "jumpSsh" ? form.haproxyPort : undefined,
    jumpUsername: form.connectionMode === "jumpSsh" ? form.haproxyUser : undefined,
    jumpAuthMethod: form.connectionMode === "jumpSsh" ? form.haproxyAuthMethod : undefined,
    jumpPassword: form.connectionMode === "jumpSsh" && form.haproxyAuthMethod === "password" ? form.haproxyPassword : undefined,
    jumpKeyPath: form.connectionMode === "jumpSsh" && form.haproxyAuthMethod === "key" ? form.haproxyKeyPath : undefined,
    expectedOs: form.osType
  };
}

export function buildHaproxySshRequest(form: ServerRegistrationForm): HaproxySshRequest {
  return {
    host: form.haproxyHost,
    port: form.haproxyPort,
    username: form.haproxyUser,
    authMethod: form.haproxyAuthMethod,
    password: form.haproxyAuthMethod === "password" ? form.haproxyPassword : undefined,
    keyPath: form.haproxyAuthMethod === "key" ? form.haproxyKeyPath : undefined,
    expectedOs: form.osType
  };
}

export function buildAgentHaproxyApplyRequest(form: ServerRegistrationForm): HaproxyApplyRequest {
  assertUsableAllowedCidrs(form.haproxyAllowedCidrs);

  return {
    ...buildHaproxySshRequest(form),
    serverId: buildProxyServerId(form),
    routes: [
      {
        id: "agent",
        purpose: "agent",
        protocol: "tcp",
        externalPort: form.haproxyAgentProxyPort,
        targetHost: form.sshHost,
        targetPort: AGENT_PORT,
        allowedCidrs: form.haproxyAllowedCidrs
      }
    ]
  };
}

export function buildGameHaproxyApplyRequest(
  server: ManagedServer,
  externalPort: number,
  targetPort: number,
  protocol: "tcp" | "udp",
  passwordOverride?: string
): HaproxyApplyRequest {
  if (!server.haproxyHost || !server.haproxyUser || !server.sshHost) {
    throw new Error("HAProxy 경유 게임 포트를 설정하려면 경유 노드와 내부망 서버 정보가 필요합니다.");
  }

  assertUsableAllowedCidrs(server.haproxyAllowedCidrs);

  return {
    host: server.haproxyHost,
    port: server.haproxyPort ?? 22,
    username: server.haproxyUser,
    authMethod: server.haproxyAuthMethod ?? "key",
    password: (server.haproxyAuthMethod ?? "key") === "password" ? passwordOverride : undefined,
    keyPath: (server.haproxyAuthMethod ?? "key") === "key" ? server.haproxyKeyPath : undefined,
    expectedOs: server.osType,
    serverId: buildProxyServerId(server),
    routes: [
      {
        id: "agent",
        purpose: "agent",
        protocol: "tcp",
        externalPort: server.haproxyAgentProxyPort ?? AGENT_PORT,
        targetHost: server.sshHost,
        targetPort: AGENT_PORT,
        allowedCidrs: server.haproxyAllowedCidrs
      },
      {
        id: `game-${externalPort}-${protocol}`,
        purpose: "game",
        protocol,
        externalPort,
        targetHost: server.sshHost,
        targetPort,
        allowedCidrs: server.haproxyAllowedCidrs
      }
    ]
  };
}

export function buildGameHaproxyRemoveRequest(
  server: ManagedServer,
  externalPort: number,
  protocol: "tcp" | "udp",
  passwordOverride?: string,
  closePorts: HaproxyRemoveRequest["closePorts"] = []
): HaproxyRemoveRequest {
  if (!server.haproxyHost || !server.haproxyUser || !server.sshHost) {
    throw new Error("HAProxy 경유 게임 포트를 정리하려면 경유 노드와 내부망 서버 정보가 필요합니다.");
  }

  return {
    host: server.haproxyHost,
    port: server.haproxyPort ?? 22,
    username: server.haproxyUser,
    authMethod: server.haproxyAuthMethod ?? "key",
    password: (server.haproxyAuthMethod ?? "key") === "password" ? passwordOverride : undefined,
    sudoPassword: passwordOverride,
    keyPath: (server.haproxyAuthMethod ?? "key") === "key" ? server.haproxyKeyPath : undefined,
    expectedOs: server.osType,
    serverId: buildProxyServerId(server),
    targetHosts: [server.sshHost],
    routeIds: [`game-${externalPort}-${protocol}`],
    closePorts
  };
}

export function buildProxyServerId(form: ServerRegistrationForm | ManagedServer) {
  return `server-${form.sshHost || "unknown"}`.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function buildAgentBaseUrl(form: ServerRegistrationForm) {
  if (form.targetType === "local") {
    return form.agentBaseUrl || `http://127.0.0.1:${AGENT_PORT}`;
  }

  if (form.connectionMode === "jumpSsh") {
    return form.haproxyHost ? `http://${form.haproxyHost}:${form.haproxyAgentProxyPort || AGENT_PORT}` : "";
  }

  return form.sshHost ? `http://${form.sshHost}:${AGENT_PORT}` : "";
}

export function normalizeRegistrationForm(nextForm: ServerRegistrationForm): ServerRegistrationForm {
  const normalizedForm = {
    ...nextForm,
    connectionMode: nextForm.targetType === "local" ? "directSsh" : nextForm.connectionMode,
    agentAccessMode: nextForm.targetType === "local" ? "direct" : nextForm.connectionMode === "jumpSsh" ? "haproxy" : "direct"
  } satisfies ServerRegistrationForm;

  return {
    ...normalizedForm,
    agentBaseUrl: buildAgentBaseUrl(normalizedForm)
  };
}

export function buildServerFromRegistration(
  registrationForm: ServerRegistrationForm,
  status: ManagedServer["lastAgentPrepareStatus"],
  message: string,
  agentToken = registrationForm.agentToken || undefined
): ManagedServer {
  return {
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
    agentBaseUrl: buildAgentBaseUrl(registrationForm),
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
    agentToken,
    lastAgentPrepareStatus: status,
    lastAgentPrepareMessage: message,
    status: status === "ready" ? "connected" : "setupRequired",
    agentStatus: status === "ready" ? "connected" : status === "agentApiBlocked" ? "offline" : "notInstalled",
    dockerStatus: status === "needsDocker" ? "needsSetup" : "ready"
  };
}
