import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("remoteGameServer", {
  appName: "Remote Game Server",
  loadServers: () => ipcRenderer.invoke("servers:load"),
  saveServers: (servers: unknown) => ipcRenderer.invoke("servers:save", servers),
  testSSH: (request: unknown) => ipcRenderer.invoke("ssh:test", request),
  prepareAgent: (request: unknown) => ipcRenderer.invoke("agent:prepare", request),
  removeAgent: (request: unknown) => ipcRenderer.invoke("agent:remove", request),
  openFirewallPort: (request: unknown) => ipcRenderer.invoke("firewall:openPort", request),
  closeFirewallPort: (request: unknown) => ipcRenderer.invoke("firewall:closePort", request),
  checkHaproxy: (request: unknown) => ipcRenderer.invoke("haproxy:status", request),
  installHaproxy: (request: unknown) => ipcRenderer.invoke("haproxy:install", request),
  applyHaproxy: (request: unknown) => ipcRenderer.invoke("haproxy:apply", request),
  removeHaproxyRoutes: (request: unknown) => ipcRenderer.invoke("haproxy:remove", request)
});
