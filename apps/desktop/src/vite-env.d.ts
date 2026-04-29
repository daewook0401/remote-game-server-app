/// <reference types="vite/client" />

interface Window {
  remoteGameServer?: {
    appName: string;
    loadServers?: () => Promise<unknown>;
    saveServers?: (servers: unknown) => Promise<boolean>;
    testSSH?: (request: unknown) => Promise<unknown>;
    prepareAgent?: (request: unknown) => Promise<unknown>;
    removeAgent?: (request: unknown) => Promise<unknown>;
    openFirewallPort?: (request: unknown) => Promise<unknown>;
    closeFirewallPort?: (request: unknown) => Promise<unknown>;
    checkHaproxy?: (request: unknown) => Promise<unknown>;
    installHaproxy?: (request: unknown) => Promise<unknown>;
    applyHaproxy?: (request: unknown) => Promise<unknown>;
    removeHaproxyRoutes?: (request: unknown) => Promise<unknown>;
  };
}
