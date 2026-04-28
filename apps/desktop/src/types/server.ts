export type ServerTargetType = "local" | "remote" | "cloud";

export type ServerStatus = "connected" | "setupRequired" | "offline";

export interface ManagedServer {
  id: string;
  name: string;
  targetType: ServerTargetType;
  host: string;
  agentBaseUrl: string;
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  sshKeyPath?: string;
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
  sshHost: string;
  sshPort: number;
  sshUser: string;
  sshKeyPath: string;
  agentBaseUrl: string;
  agentToken: string;
}

export interface ContainerSummary {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped";
  port: number;
}
