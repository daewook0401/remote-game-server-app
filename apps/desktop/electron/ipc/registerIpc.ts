import { ipcMain } from "electron";
import { prepareAgent } from "../services/agentBootstrapService.js";
import { loadServers, saveServers } from "../services/serverStorageService.js";
import { testSSH } from "../services/sshDiagnosticsService.js";
import type { AgentPrepareRequest, SshRequest } from "../types.js";

export function registerIpcHandlers() {
  ipcMain.handle("servers:load", loadServers);
  ipcMain.handle("servers:save", (_event, servers: unknown) => saveServers(servers));
  ipcMain.handle("ssh:test", (_event, request: SshRequest) => testSSH(request));
  ipcMain.handle("agent:prepare", (_event, request: AgentPrepareRequest) => prepareAgent(request));
}
