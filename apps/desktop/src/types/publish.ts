export interface ConnectionMode {
  title: string;
  status: "MVP" | "Guide";
  description: string;
}

export type PublishStatus = "idle" | "allocating" | "published" | "stopping" | "failed";

export interface PublishSession {
  status: PublishStatus;
  relayHost: string;
  remotePort?: number;
  internalPort: number;
  protocol: "tcp";
  errorMessage?: string;
}
