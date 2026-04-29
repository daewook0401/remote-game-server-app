import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { prepareAgent, removeAgent } from "../services/agentBootstrapService.js";
import { closeFirewallPort, openFirewallPort } from "../services/firewallService.js";
import { applyHaproxy, checkHaproxy, installHaproxy, removeHaproxyRoutes } from "../services/haproxyService.js";
import { loadServers, saveServers } from "../services/serverStorageService.js";
import { testSSH } from "../services/sshDiagnosticsService.js";
import type {
  AgentPrepareRequest,
  AgentRemoveRequest,
  FirewallClosePortRequest,
  FirewallOpenPortRequest,
  HaproxyApplyRequest,
  HaproxyRemoveRequest,
  HaproxySshRequest,
  SshRequest
} from "../types.js";

function cloneSafeError(error: unknown) {
  if (error instanceof Error) {
    return new Error(error.message || "요청 처리 중 오류가 발생했습니다.");
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("요청 처리 중 오류가 발생했습니다.");
}

function handleIpc<T>(handler: (request: T) => unknown) {
  return async (_event: IpcMainInvokeEvent, request: T) => {
    try {
      return await handler(request);
    } catch (error) {
      throw cloneSafeError(error);
    }
  };
}

export function registerIpcHandlers() {
  ipcMain.handle("servers:load", async () => {
    try {
      return await loadServers();
    } catch (error) {
      throw cloneSafeError(error);
    }
  });
  ipcMain.handle("servers:save", handleIpc<unknown>(saveServers));
  ipcMain.handle("ssh:test", handleIpc<SshRequest>(testSSH));
  ipcMain.handle("agent:prepare", handleIpc<AgentPrepareRequest>(prepareAgent));
  ipcMain.handle("agent:remove", handleIpc<AgentRemoveRequest>(removeAgent));
  ipcMain.handle("firewall:openPort", handleIpc<FirewallOpenPortRequest>(openFirewallPort));
  ipcMain.handle("firewall:closePort", handleIpc<FirewallClosePortRequest>(closeFirewallPort));
  ipcMain.handle("haproxy:status", handleIpc<HaproxySshRequest>(checkHaproxy));
  ipcMain.handle("haproxy:install", handleIpc<HaproxySshRequest>(installHaproxy));
  ipcMain.handle("haproxy:apply", handleIpc<HaproxyApplyRequest>(applyHaproxy));
  ipcMain.handle("haproxy:remove", handleIpc<HaproxyRemoveRequest>(removeHaproxyRoutes));
}
