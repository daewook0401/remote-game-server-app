export type ServerTargetType = "local" | "remote" | "cloud";

export type ServerStatus = "connected" | "setupRequired" | "offline";

export type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

export type SshAuthMethod = "password" | "key";

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

export interface SshTestResult {
  connected: boolean;
  detectedOs: string;
  expectedOs: ServerOsType;
  osMatches: boolean;
  output: string;
}

export interface ContainerSummary {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped";
  port: number;
}
