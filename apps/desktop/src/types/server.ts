export type ServerTargetType = "local" | "remote" | "cloud";

export type ServerStatus = "connected" | "setupRequired" | "offline";

export type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

export type SshAuthMethod = "password" | "key";

export type DockerIssue = "none" | "notInstalled" | "daemonStopped" | "permissionDenied" | "unknown";

export interface ManagedServer {
  id: string;
  name: string;
  targetType: ServerTargetType;
  osType: ServerOsType;
  host: string;
  agentBaseUrl: string;
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  sshKeyPath?: string;
  sshAuthMethod?: SshAuthMethod;
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
  osType: ServerOsType;
  sshHost: string;
  sshPort: number;
  sshUser: string;
  sshAuthMethod: SshAuthMethod;
  sshKeyPath: string;
  sshPassword: string;
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
  expectedOs: ServerOsType;
}

export interface AgentPrepareRequest extends SshTestRequest {
  agentToken?: string;
  downloadUrl: string;
}

export interface FirewallOpenPortRequest extends SshTestRequest {
  firewallPort: number;
  protocol: "tcp" | "udp";
  sudoPassword: string;
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
