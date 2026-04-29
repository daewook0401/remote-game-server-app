export type ServerTargetType = "local" | "remote" | "cloud";

export type ServerConnectionMode = "directSsh" | "jumpSsh" | "directPublic";

export type AgentAccessMode = "direct" | "sshTunnel" | "haproxy";

export type ServerStatus = "connected" | "setupRequired" | "offline";

export type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

export type SshAuthMethod = "password" | "key";

export type ProxyProtocol = "tcp" | "udp";

export type DockerIssue = "none" | "notInstalled" | "daemonStopped" | "permissionDenied" | "unknown";

export interface ManagedServer {
  id: string;
  name: string;
  targetType: ServerTargetType;
  connectionMode?: ServerConnectionMode;
  agentAccessMode?: AgentAccessMode;
  osType: ServerOsType;
  host: string;
  agentBaseUrl: string;
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  sshKeyPath?: string;
  sshAuthMethod?: SshAuthMethod;
  jumpHost?: string;
  jumpPort?: number;
  jumpUser?: string;
  jumpKeyPath?: string;
  jumpAuthMethod?: SshAuthMethod;
  haproxyHost?: string;
  haproxyPort?: number;
  haproxyUser?: string;
  haproxyKeyPath?: string;
  haproxyAuthMethod?: SshAuthMethod;
  haproxyAllowedCidrs?: string;
  haproxyAgentProxyPort?: number;
  agentToken?: string;
  lastAgentPrepareStatus?: "ready" | "needsDocker" | "agentApiBlocked" | "failed";
  lastAgentPrepareMessage?: string;
  status: ServerStatus;
  agentStatus: "connected" | "notInstalled" | "offline";
  dockerStatus: "ready" | "needsSetup" | "unknown";
}

export interface GameTemplate {
  id: string;
  name: string;
  image: string;
  defaultPort: number;
  protocol: "tcp";
}

export interface ServerCreateForm {
  targetType: ServerTargetType;
  sshHost: string;
  sshPort: number;
  sshUser: string;
  gameTemplateId: string;
  serverName: string;
  internalPort: number;
  externalPort: number;
  memory: string;
  eulaAccepted: boolean;
}

export interface ServerRegistrationForm {
  name: string;
  targetType: ServerTargetType;
  connectionMode: ServerConnectionMode;
  agentAccessMode: AgentAccessMode;
  osType: ServerOsType;
  sshHost: string;
  sshPort: number;
  sshUser: string;
  sshAuthMethod: SshAuthMethod;
  sshKeyPath: string;
  sshPassword: string;
  jumpHost: string;
  jumpPort: number;
  jumpUser: string;
  jumpAuthMethod: SshAuthMethod;
  jumpKeyPath: string;
  jumpPassword: string;
  haproxyHost: string;
  haproxyPort: number;
  haproxyUser: string;
  haproxyAuthMethod: SshAuthMethod;
  haproxyKeyPath: string;
  haproxyPassword: string;
  haproxyAllowedCidrs: string;
  haproxyAgentProxyPort: number;
  agentBaseUrl: string;
  agentToken: string;
  agentDownloadUrl: string;
}

export interface SshTestRequest {
  host: string;
  port: number;
  username: string;
  authMethod: SshAuthMethod;
  password?: string;
  keyPath?: string;
  connectionMode?: ServerConnectionMode;
  jumpHost?: string;
  jumpPort?: number;
  jumpUsername?: string;
  jumpAuthMethod?: SshAuthMethod;
  jumpPassword?: string;
  jumpKeyPath?: string;
  expectedOs: ServerOsType;
}

export interface AgentPrepareRequest extends SshTestRequest {
  agentToken?: string;
  downloadUrl: string;
}

export interface AgentRemoveRequest extends SshTestRequest {
  closeAgentFirewallPort: boolean;
}

export interface AgentRemoveResult {
  removed: boolean;
  firewallClosed: boolean;
  output: string;
}

export interface HaproxySshRequest {
  host: string;
  port: number;
  username: string;
  authMethod: SshAuthMethod;
  password?: string;
  sudoPassword?: string;
  keyPath?: string;
  expectedOs: ServerOsType;
}

export interface HaproxyPortRoute {
  id: string;
  purpose: "agent" | "game";
  protocol: ProxyProtocol;
  externalPort: number;
  targetHost: string;
  targetPort: number;
  allowedCidrs?: string;
}

export interface HaproxyApplyRequest extends HaproxySshRequest {
  serverId: string;
  routes: HaproxyPortRoute[];
}

export interface HaproxyStatusResult {
  installed: boolean;
  version: string;
  udpSupported: boolean;
  output: string;
}

export interface HaproxyApplyResult {
  applied: boolean;
  firewallOpened: boolean;
  reloaded: boolean;
  udpSupported: boolean;
  output: string;
}

export interface HaproxyRemoveRequest extends HaproxySshRequest {
  serverId: string;
  targetHosts?: string[];
  routeIds?: string[];
  closePorts: Array<{ port: number; protocol: ProxyProtocol; allowedCidrs?: string }>;
}

export interface HaproxyRemoveResult {
  removed: boolean;
  reloaded: boolean;
  output: string;
}

export interface FirewallOpenPortRequest extends SshTestRequest {
  firewallPort: number;
  protocol: "tcp" | "udp";
  sudoPassword: string;
}

export interface FirewallClosePortRequest extends FirewallOpenPortRequest {
  closeMode: "deleteAllow" | "deny";
}

export interface FirewallOpenPortResult {
  opened: boolean;
  method: string;
  message: string;
  output: string;
}

export interface SshTestResult {
  connected: boolean;
  detectedOs: string;
  expectedOs: ServerOsType;
  osMatches: boolean;
  dockerInstalled: boolean;
  dockerDaemonRunning: boolean;
  dockerPermission: boolean | "unknown";
  dockerIssue: DockerIssue;
  dockerReady: boolean;
  agentPortOpen: boolean;
  output: string;
}

export interface AgentPrepareResult {
  installed: boolean;
  started: boolean;
  agentPortOpen: boolean;
  firewallOpened: boolean;
  output: string;
}

export interface ContainerSummary {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped";
  port: number;
  instanceId?: string;
  volumePath?: string;
}

export interface ServerCreateReadiness {
  canCreate: boolean;
  items: Array<{
    label: string;
    ok: boolean;
  }>;
  message: string;
}
