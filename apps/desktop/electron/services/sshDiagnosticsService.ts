import type { SshRequest } from "../types.js";
import {
  detectOperatingSystem,
  doesOperatingSystemMatch,
  dockerIssue,
  extractSection,
  hasDockerPermission,
  isAgentPortOpen,
  isDockerDaemonRunning,
  isDockerInstalled,
  isDockerReady,
  osDetectionCommand
} from "../ssh/detection.js";
import { runSshCommand } from "../ssh/sshClient.js";

export async function testSSH(request: SshRequest) {
  const output = await runSshCommand(request, osDetectionCommand(request.expectedOs));
  const detectedOs = detectOperatingSystem(extractSection(output, "OS"));

  return {
    connected: true,
    detectedOs,
    expectedOs: request.expectedOs,
    osMatches: doesOperatingSystemMatch(request.expectedOs, detectedOs),
    dockerInstalled: isDockerInstalled(output),
    dockerDaemonRunning: isDockerDaemonRunning(output),
    dockerPermission: hasDockerPermission(output),
    dockerIssue: dockerIssue(output),
    dockerReady: isDockerReady(output),
    agentPortOpen: isAgentPortOpen(output),
    output
  };
}
