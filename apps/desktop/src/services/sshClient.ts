import type { SshTestRequest, SshTestResult } from "../types/server";

export async function testSSHConnection(request: SshTestRequest): Promise<SshTestResult> {
  if (!window.remoteGameServer?.testSSH) {
    throw new Error("SSH 테스트는 Electron 실행 환경에서만 사용할 수 있습니다.");
  }

  return (await window.remoteGameServer.testSSH(request)) as SshTestResult;
}
