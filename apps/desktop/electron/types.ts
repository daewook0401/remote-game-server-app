export type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

export interface SshRequest {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
  password?: string;
  keyPath?: string;
  expectedOs: ServerOsType;
}

export interface AgentPrepareRequest extends SshRequest {
  agentToken?: string;
  downloadUrl: string;
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
