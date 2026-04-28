import type { ManagedServer } from "../types/server";

const browserStorageKey = "remote-game-server.managedServers";

function isManagedServerList(value: unknown): value is ManagedServer[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<ManagedServer>;
    return Boolean(candidate.id && candidate.name && candidate.targetType && candidate.agentBaseUrl);
  });
}

function normalizeServer(server: ManagedServer): ManagedServer {
  return {
    ...server,
    osType: server.osType ?? "linux-ubuntu",
    sshAuthMethod: server.sshAuthMethod ?? (server.sshKeyPath ? "key" : "password")
  };
}

export async function loadStoredServers(): Promise<ManagedServer[] | null> {
  const electronApi = window.remoteGameServer;
  if (electronApi?.loadServers) {
    const stored = await electronApi.loadServers();
    return isManagedServerList(stored) ? stored.map(normalizeServer) : null;
  }

  const raw = window.localStorage.getItem(browserStorageKey);
  if (!raw) {
    return null;
  }

  const stored = JSON.parse(raw) as unknown;
  return isManagedServerList(stored) ? stored.map(normalizeServer) : null;
}

export async function saveStoredServers(servers: ManagedServer[]) {
  const electronApi = window.remoteGameServer;
  if (electronApi?.saveServers) {
    await electronApi.saveServers(servers);
    return;
  }

  window.localStorage.setItem(browserStorageKey, JSON.stringify(servers));
}
