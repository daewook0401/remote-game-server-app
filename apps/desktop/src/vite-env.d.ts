/// <reference types="vite/client" />

interface Window {
  remoteGameServer?: {
    appName: string;
    loadServers?: () => Promise<unknown>;
    saveServers?: (servers: unknown) => Promise<boolean>;
    testSSH?: (request: unknown) => Promise<unknown>;
    prepareAgent?: (request: unknown) => Promise<unknown>;
  };
}
