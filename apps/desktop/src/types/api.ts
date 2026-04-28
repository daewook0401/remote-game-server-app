export interface CreateMinecraftServerRequest {
  serverId: string;
  targetType: "local" | "remote" | "cloud";
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  gameTemplateId: string;
  instanceId: string;
  containerName: string;
  image: string;
  internalPort: number;
  externalPort: number;
  memory: string;
  eulaAccepted: boolean;
}

export interface ContainerActionRequest {
  containerId: string;
  action: "start" | "stop" | "delete";
}

export interface ConsoleAttachRequest {
  containerId: string;
}

export interface ContainerSummaryResponse {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped";
  port: number;
  instanceId: string;
}

export interface ConsoleSnapshotResponse {
  containerId: string;
  lines: string[];
}

export interface DockerStatusResponse {
  available: boolean;
  mode: "memory" | "cli";
  message: string;
  agentVersion?: string;
}

export interface RelayPortAllocationResponse {
  port: number;
}
