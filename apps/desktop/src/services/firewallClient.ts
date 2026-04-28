import type { FirewallClosePortRequest, FirewallOpenPortRequest, FirewallOpenPortResult } from "../types/server";

export async function openRemoteFirewallPort(request: FirewallOpenPortRequest): Promise<FirewallOpenPortResult> {
  if (!window.remoteGameServer?.openFirewallPort) {
    throw new Error("포트 설정은 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.openFirewallPort(request)) as FirewallOpenPortResult;
}

export async function closeRemoteFirewallPort(request: FirewallClosePortRequest): Promise<FirewallOpenPortResult> {
  if (!window.remoteGameServer?.closeFirewallPort) {
    throw new Error("포트 정리는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.closeFirewallPort(request)) as FirewallOpenPortResult;
}
