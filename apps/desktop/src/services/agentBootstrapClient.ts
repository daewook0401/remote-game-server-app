import type { AgentPrepareRequest, AgentPrepareResult, AgentRemoveRequest, AgentRemoveResult } from "../types/server";

export async function prepareRemoteAgent(request: AgentPrepareRequest): Promise<AgentPrepareResult> {
  if (!window.remoteGameServer?.prepareAgent) {
    throw new Error("Agent 준비는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.prepareAgent(request)) as AgentPrepareResult;
}

export async function removeRemoteAgent(request: AgentRemoveRequest): Promise<AgentRemoveResult> {
  if (!window.remoteGameServer?.removeAgent) {
    throw new Error("Agent 삭제는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.removeAgent(request)) as AgentRemoveResult;
}
