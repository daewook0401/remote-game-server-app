import { runSshCommandWithInput } from "../ssh/sshClient.js";
import { buildFirewallCloseScript, buildFirewallOpenScript } from "../commands/firewallFragments.js";
import { FIREWALL_SENTINELS } from "../commands/sentinels.js";
import { validatePort } from "../commands/shellFragments.js";
import { shellSingleQuote } from "../commands/shellQuote.js";
import type { FirewallClosePortRequest, FirewallOpenPortRequest, FirewallOpenPortResult } from "../types.js";

export async function openFirewallPort(request: FirewallOpenPortRequest): Promise<FirewallOpenPortResult> {
  if (!validatePort(request.firewallPort)) {
    throw new Error("포트는 1부터 65535 사이의 숫자여야 합니다.");
  }

  if (request.authMethod !== "password" || !request.password || !request.sudoPassword) {
    throw new Error("자동 포트 설정은 SSH password 인증에서만 SSH 비밀번호를 sudo에 재사용할 수 있습니다.");
  }

  const script = buildFirewallOpenScript(request.firewallPort, request.protocol);
  const command = `sudo -S -p "" sh -c ${shellSingleQuote(script)}`;
  const output = await runSshCommandWithInput(request, command, `${request.sudoPassword}\n`);
  const methodMatch = output.match(/method=([a-zA-Z0-9_-]+)/);
  const messageMatch = output.match(/message=([a-zA-Z0-9_-]+)/);

  return {
    opened: output.includes(FIREWALL_SENTINELS.ok),
    method: methodMatch?.[1] ?? "unknown",
    message: messageMatch?.[1] ?? "포트 설정 명령을 실행했습니다.",
    output
  };
}

export async function closeFirewallPort(request: FirewallClosePortRequest): Promise<FirewallOpenPortResult> {
  if (!validatePort(request.firewallPort)) {
    throw new Error("포트는 1부터 65535 사이의 숫자여야 합니다.");
  }

  if (request.authMethod !== "password" || !request.password || !request.sudoPassword) {
    throw new Error("자동 방화벽 정리는 SSH password 인증에서만 SSH 비밀번호를 sudo에 재사용할 수 있습니다.");
  }

  const script = buildFirewallCloseScript(request.firewallPort, request.protocol, request.closeMode);
  const command = `sudo -S -p "" sh -c ${shellSingleQuote(script)}`;
  const output = await runSshCommandWithInput(request, command, `${request.sudoPassword}\n`);
  const methodMatch = output.match(/method=([a-zA-Z0-9_-]+)/);
  const messageMatch = output.match(/message=([a-zA-Z0-9_-]+)/);

  return {
    opened: output.includes(FIREWALL_SENTINELS.ok),
    method: methodMatch?.[1] ?? "unknown",
    message: messageMatch?.[1] ?? "방화벽 정리 명령을 실행했습니다.",
    output
  };
}
