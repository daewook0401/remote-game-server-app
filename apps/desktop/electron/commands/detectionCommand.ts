import type { ServerOsType } from "../types.js";
import { REMOTE_AGENT_DEFAULTS, REMOTE_TEMP_FILES } from "../config/remoteDefaults.js";
import { AGENT_SENTINELS, DETECTION_MARKERS, DETECTION_SENTINELS } from "./sentinels.js";

function windowsDetectionCommand() {
  return [
    "powershell -NoProfile -Command",
    "\"",
    `Write-Output '${DETECTION_MARKERS.osStart}';`,
    "$PSVersionTable.OS;",
    "[System.Environment]::OSVersion.VersionString;",
    `Write-Output '${DETECTION_MARKERS.osEnd}';`,
    `Write-Output '${DETECTION_MARKERS.dockerStart}';`,
    `if (Get-Command docker -ErrorAction SilentlyContinue) { Write-Output '${DETECTION_SENTINELS.dockerInstalledTrue}'; docker --version; docker info 2>$null; if ($LASTEXITCODE -eq 0) { Write-Output '${DETECTION_SENTINELS.dockerDaemonTrue}'; Write-Output '${DETECTION_SENTINELS.dockerPermissionTrue}'; Write-Output '${DETECTION_SENTINELS.dockerReadyTrue}' } else { Write-Output '${DETECTION_SENTINELS.dockerDaemonFalse}'; Write-Output '${DETECTION_SENTINELS.dockerPermissionUnknown}'; Write-Output '${DETECTION_SENTINELS.dockerReadyFalse}' } } else { Write-Output '${DETECTION_SENTINELS.dockerInstalledFalse}'; Write-Output '${DETECTION_SENTINELS.dockerDaemonFalse}'; Write-Output '${DETECTION_SENTINELS.dockerPermissionFalse}'; Write-Output '${DETECTION_SENTINELS.dockerReadyFalse}' };`,
    `Write-Output '${DETECTION_MARKERS.dockerEnd}';`,
    `Write-Output '${DETECTION_MARKERS.agentStart}';`,
    `if ((Test-NetConnection 127.0.0.1 -Port ${REMOTE_AGENT_DEFAULTS.port} -InformationLevel Quiet)) { Write-Output '${AGENT_SENTINELS.portOpenTrue}' } else { Write-Output '${AGENT_SENTINELS.portOpenFalse}' };`,
    `Write-Output '${DETECTION_MARKERS.agentEnd}'`,
    "\""
  ].join(" ");
}

function macosDetectionCommand() {
  return [
    `printf '${DETECTION_MARKERS.osStart}\\n';`,
    "sw_vers -productName 2>/dev/null; sw_vers -productVersion 2>/dev/null; uname -a;",
    `printf '\\n${DETECTION_MARKERS.osEnd}\\n';`,
    `printf '${DETECTION_MARKERS.dockerStart}\\n';`,
    `if command -v docker >/dev/null 2>&1; then printf '${DETECTION_SENTINELS.dockerInstalledTrue}\\n'; docker --version; DOCKER_INFO_OUTPUT=$(docker info 2>&1 >${REMOTE_TEMP_FILES.dockerInfo} || true); DOCKER_INFO_OUTPUT="$DOCKER_INFO_OUTPUT $(cat ${REMOTE_TEMP_FILES.dockerInfo} 2>/dev/null || true)"; if docker info >/dev/null 2>&1; then printf '${DETECTION_SENTINELS.dockerDaemonTrue}\\n${DETECTION_SENTINELS.dockerPermissionTrue}\\n${DETECTION_SENTINELS.dockerReadyTrue}\\n'; elif printf '%s' "$DOCKER_INFO_OUTPUT" | grep -Eiq 'permission denied|Got permission denied|permission'; then printf '${DETECTION_SENTINELS.dockerDaemonTrue}\\n${DETECTION_SENTINELS.dockerPermissionFalse}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; else printf '${DETECTION_SENTINELS.dockerDaemonFalse}\\n${DETECTION_SENTINELS.dockerPermissionUnknown}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; fi; else printf '${DETECTION_SENTINELS.dockerInstalledFalse}\\n${DETECTION_SENTINELS.dockerDaemonFalse}\\n${DETECTION_SENTINELS.dockerPermissionFalse}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; fi;`,
    `printf '${DETECTION_MARKERS.dockerEnd}\\n';`,
    `printf '${DETECTION_MARKERS.agentStart}\\n';`,
    `if lsof -iTCP:${REMOTE_AGENT_DEFAULTS.port} -sTCP:LISTEN >/dev/null 2>&1; then printf '${AGENT_SENTINELS.portOpenTrue}\\n'; else printf '${AGENT_SENTINELS.portOpenFalse}\\n'; fi;`,
    `printf '${DETECTION_MARKERS.agentEnd}\\n'`
  ].join(" ");
}

function linuxDetectionCommand() {
  return [
    `printf '${DETECTION_MARKERS.osStart}\\n';`,
    "cat /etc/os-release 2>/dev/null || uname -a;",
    `printf '\\n${DETECTION_MARKERS.osEnd}\\n';`,
    `printf '${DETECTION_MARKERS.dockerStart}\\n';`,
    `if command -v docker >/dev/null 2>&1; then printf '${DETECTION_SENTINELS.dockerInstalledTrue}\\n'; docker --version; DOCKER_INFO_OUTPUT=$(docker info 2>&1 >${REMOTE_TEMP_FILES.dockerInfo} || true); DOCKER_INFO_OUTPUT="$DOCKER_INFO_OUTPUT $(cat ${REMOTE_TEMP_FILES.dockerInfo} 2>/dev/null || true)"; if docker info >/dev/null 2>&1; then printf '${DETECTION_SENTINELS.dockerDaemonTrue}\\n${DETECTION_SENTINELS.dockerPermissionTrue}\\n${DETECTION_SENTINELS.dockerReadyTrue}\\n'; elif printf '%s' "$DOCKER_INFO_OUTPUT" | grep -Eiq 'permission denied|Got permission denied|permission'; then printf '${DETECTION_SENTINELS.dockerDaemonTrue}\\n${DETECTION_SENTINELS.dockerPermissionFalse}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; else printf '${DETECTION_SENTINELS.dockerDaemonFalse}\\n${DETECTION_SENTINELS.dockerPermissionUnknown}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; fi; else printf '${DETECTION_SENTINELS.dockerInstalledFalse}\\n${DETECTION_SENTINELS.dockerDaemonFalse}\\n${DETECTION_SENTINELS.dockerPermissionFalse}\\n${DETECTION_SENTINELS.dockerReadyFalse}\\n'; fi;`,
    `printf '${DETECTION_MARKERS.dockerEnd}\\n';`,
    `printf '${DETECTION_MARKERS.agentStart}\\n';`,
    `if (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':${REMOTE_AGENT_DEFAULTS.port} ') || (command -v netstat >/dev/null 2>&1 && netstat -ltn | grep -q ':${REMOTE_AGENT_DEFAULTS.port} ') || (command -v lsof >/dev/null 2>&1 && lsof -iTCP:${REMOTE_AGENT_DEFAULTS.port} -sTCP:LISTEN >/dev/null 2>&1); then printf '${AGENT_SENTINELS.portOpenTrue}\\n'; else printf '${AGENT_SENTINELS.portOpenFalse}\\n'; fi;`,
    `printf '${DETECTION_MARKERS.agentEnd}\\n'`
  ].join(" ");
}

export function osDetectionCommand(expectedOs: ServerOsType) {
  if (expectedOs === "windows") {
    return windowsDetectionCommand();
  }

  if (expectedOs === "macos") {
    return macosDetectionCommand();
  }

  return linuxDetectionCommand();
}
