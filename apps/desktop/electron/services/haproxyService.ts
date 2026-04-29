import type { HaproxyApplyRequest, HaproxyRemoveRequest, HaproxySshRequest } from "../types.js";
import { haproxyApplyCommand, haproxyInstallCommand, haproxyRemoveCommand, haproxyStatusCommand } from "../ssh/haproxyScripts.js";
import { runSshCommand, runSshCommandWithInput } from "../ssh/sshClient.js";

function needsPasswordInput(request: HaproxySshRequest) {
  return request.sudoPassword || (request.authMethod === "password" && request.password);
}

function passwordInput(request: HaproxySshRequest) {
  return `${request.sudoPassword || request.password || ""}\n`;
}

function parseUdpSupport(output: string) {
  return /HAPROXY_UDP_SUPPORTED=true/i.test(output) || /udp-lb|udp module|enterprise|hapee/i.test(output);
}

export async function checkHaproxy(request: HaproxySshRequest) {
  const output = needsPasswordInput(request)
    ? await runSshCommandWithInput(request, haproxyStatusCommand(), passwordInput(request))
    : await runSshCommand(request, haproxyStatusCommand());

  return {
    installed: output.includes("HAPROXY_INSTALLED=true"),
    version: output.split("\n").find((line) => line.toLowerCase().includes("haproxy version")) ?? "",
    udpSupported: parseUdpSupport(output),
    output
  };
}

export async function installHaproxy(request: HaproxySshRequest) {
  const output = needsPasswordInput(request)
    ? await runSshCommandWithInput(request, haproxyInstallCommand(request), passwordInput(request))
    : await runSshCommand(request, haproxyInstallCommand(request));

  return {
    installed: output.includes("HAPROXY_INSTALLED=true"),
    version: output.split("\n").find((line) => line.toLowerCase().includes("haproxy version")) ?? "",
    udpSupported: parseUdpSupport(output),
    output
  };
}

export async function applyHaproxy(request: HaproxyApplyRequest) {
  const command = haproxyApplyCommand(request);
  const output = needsPasswordInput(request)
    ? await runSshCommandWithInput(request, command, passwordInput(request))
    : await runSshCommand(request, command);

  return {
    applied: output.includes("HAPROXY_APPLIED=true"),
    firewallOpened: output.includes("HAPROXY_FIREWALL_OPENED=true"),
    reloaded: output.includes("HAPROXY_RELOADED=true"),
    udpSupported: parseUdpSupport(output),
    output
  };
}

export async function removeHaproxyRoutes(request: HaproxyRemoveRequest) {
  const command = haproxyRemoveCommand(request);
  const output = needsPasswordInput(request)
    ? await runSshCommandWithInput(request, command, passwordInput(request))
    : await runSshCommand(request, command);

  return {
    removed: output.includes("HAPROXY_REMOVED=true"),
    reloaded: output.includes("HAPROXY_RELOADED=true"),
    output
  };
}
