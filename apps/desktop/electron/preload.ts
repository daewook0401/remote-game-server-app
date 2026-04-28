import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("remoteGameServer", {
  appName: "Remote Game Server",
  loadServers: () => ipcRenderer.invoke("servers:load"),
  saveServers: (servers: unknown) => ipcRenderer.invoke("servers:save", servers),
  testSSH: (request: unknown) => ipcRenderer.invoke("ssh:test", request)
});
