import type {
  HaproxyApplyRequest,
  HaproxyApplyResult,
  HaproxyRemoveRequest,
  HaproxyRemoveResult,
  HaproxySshRequest,
  HaproxyStatusResult
} from "../types/server";

export async function checkRemoteHaproxy(request: HaproxySshRequest): Promise<HaproxyStatusResult> {
  if (!window.remoteGameServer?.checkHaproxy) {
    throw new Error("HAProxy 확인은 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.checkHaproxy(request)) as HaproxyStatusResult;
}

export async function installRemoteHaproxy(request: HaproxySshRequest): Promise<HaproxyStatusResult> {
  if (!window.remoteGameServer?.installHaproxy) {
    throw new Error("HAProxy 설치는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.installHaproxy(request)) as HaproxyStatusResult;
}

export async function applyRemoteHaproxy(request: HaproxyApplyRequest): Promise<HaproxyApplyResult> {
  if (!window.remoteGameServer?.applyHaproxy) {
    throw new Error("HAProxy 설정은 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.applyHaproxy(request)) as HaproxyApplyResult;
}

export async function removeRemoteHaproxyRoutes(request: HaproxyRemoveRequest): Promise<HaproxyRemoveResult> {
  if (!window.remoteGameServer?.removeHaproxyRoutes) {
    throw new Error("HAProxy 정리는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.removeHaproxyRoutes(request)) as HaproxyRemoveResult;
}
