export type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

export interface SshRequest {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
  password?: string;
  keyPath?: string;
  connectionMode?: "directSsh" | "jumpSsh" | "directPublic";
  jumpHost?: string;
  jumpPort?: number;
  jumpUsername?: string;
  jumpAuthMethod?: "password" | "key";
  jumpPassword?: string;
  jumpKeyPath?: string;
  expectedOs: ServerOsType;
}

export interface AgentPrepareRequest extends SshRequest {
  agentToken?: string;
  downloadUrl: string;
}

export interface AgentRemoveRequest extends SshRequest {
  closeAgentFirewallPort: boolean;
}

export interface AgentRemoveResult {
  removed: boolean;
  firewallClosed: boolean;
  output: string;
}

export interface FirewallOpenPortRequest extends SshRequest {
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

export type ProxyProtocol = "tcp" | "udp";

export interface HaproxySshRequest {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
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

export interface HaproxyRemoveRequest extends HaproxySshRequest {
  serverId: string;
  targetHosts?: string[];
  routeIds?: string[];
  closePorts: Array<{ port: number; protocol: ProxyProtocol; allowedCidrs?: string }>;
}
