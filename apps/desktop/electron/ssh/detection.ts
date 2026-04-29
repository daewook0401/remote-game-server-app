import type { ServerOsType } from "../types.js";
import { DETECTION_SECTIONS, DETECTION_SENTINELS, detectionSectionEnd, detectionSectionStart } from "../commands/sentinels.js";

export { osDetectionCommand } from "../commands/detectionCommand.js";

export function extractSection(output: string, section: string) {
  const start = detectionSectionStart(section);
  const end = detectionSectionEnd(section);
  const startIndex = output.indexOf(start);
  const endIndex = output.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return output;
  }

  return output.slice(startIndex + start.length, endIndex).trim();
}

export function detectOperatingSystem(output: string) {
  const normalized = output.toLowerCase();
  if (normalized.includes("ubuntu")) return "linux-ubuntu";
  if (normalized.includes("fedora")) return "linux-fedora";
  if (normalized.includes("arch")) return "linux-arch";
  if (normalized.includes("darwin") || normalized.includes("mac os")) return "macos";
  if (normalized.includes("windows")) return "windows";
  if (normalized.includes("linux")) return "linux";
  return "unknown";
}

export function doesOperatingSystemMatch(expectedOs: ServerOsType, detectedOs: string) {
  return expectedOs === "linux" ? detectedOs.startsWith("linux") : expectedOs === detectedOs;
}

export function isDockerInstalled(output: string) {
  const dockerSection = extractSection(output, DETECTION_SECTIONS.docker).toLowerCase();
  return dockerSection.includes(DETECTION_SENTINELS.dockerInstalledTrue.toLowerCase()) || dockerSection.includes("docker version");
}

export function isDockerReady(output: string) {
  return extractSection(output, DETECTION_SECTIONS.docker).toLowerCase().includes(DETECTION_SENTINELS.dockerReadyTrue.toLowerCase());
}

export function isDockerDaemonRunning(output: string) {
  return extractSection(output, DETECTION_SECTIONS.docker).toLowerCase().includes(DETECTION_SENTINELS.dockerDaemonTrue.toLowerCase());
}

export function hasDockerPermission(output: string) {
  const dockerSection = extractSection(output, DETECTION_SECTIONS.docker).toLowerCase();
  if (dockerSection.includes(DETECTION_SENTINELS.dockerPermissionTrue.toLowerCase())) return true;
  if (dockerSection.includes(DETECTION_SENTINELS.dockerPermissionFalse.toLowerCase())) return false;
  return "unknown";
}

export function dockerIssue(output: string) {
  if (!isDockerInstalled(output)) return "notInstalled";
  if (!isDockerDaemonRunning(output)) return "daemonStopped";
  if (hasDockerPermission(output) === false) return "permissionDenied";
  if (!isDockerReady(output)) return "unknown";
  return "none";
}

export function isAgentPortOpen(output: string) {
  return extractSection(output, DETECTION_SECTIONS.agent).toLowerCase().includes(DETECTION_SENTINELS.agentPortOpenTrue.toLowerCase());
}
