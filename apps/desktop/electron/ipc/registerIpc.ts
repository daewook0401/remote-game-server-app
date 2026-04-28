import { ipcMain } from "electron";
import { prepareAgent } from "../services/agentBootstrapService.js";
import { closeFirewallPort, openFirewallPort } from "../services/firewallService.js";
import { loadServers, saveServers } from "../services/serverStorageService.js";
import { testSSH } from "../services/sshDiagnosticsService.js";
import type { AgentPrepareRequest, FirewallClosePortRequest, FirewallOpenPortRequest, SshRequest } from "../types.js";

export function registerIpcHandlers() {
  ipcMain.handle("servers:load", loadServers);
  ipcMain.handle("servers:save", (_event, servers: unknown) => saveServers(servers));
  ipcMain.handle("ssh:test", (_event, request: SshRequest) => testSSH(request));
  ipcMain.handle("agent:prepare", (_event, request: AgentPrepareRequest) => prepareAgent(request));
  ipcMain.handle("firewall:openPort", (_event, request: FirewallOpenPortRequest) => openFirewallPort(request));
  ipcMain.handle("firewall:closePort", (_event, request: FirewallClosePortRequest) => closeFirewallPort(request));
}
