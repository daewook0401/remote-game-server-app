import type { SshRequest } from "../types.js";
import {
  detectOperatingSystem,
  doesOperatingSystemMatch,
  extractSection,
  isAgentPortOpen,
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
    dockerReady: isDockerReady(output),
    agentPortOpen: isAgentPortOpen(output),
    output
  };
}
