import type { ServerOsType } from "../types.js";

export function osDetectionCommand(expectedOs: ServerOsType) {
  if (expectedOs === "windows") {
    return [
      "powershell -NoProfile -Command",
      "\"",
      "Write-Output '__OS_START__';",
      "$PSVersionTable.OS;",
      "[System.Environment]::OSVersion.VersionString;",
      "Write-Output '__OS_END__';",
      "Write-Output '__DOCKER_START__';",
      "if (Get-Command docker -ErrorAction SilentlyContinue) { docker --version; docker info 2>$null; if ($LASTEXITCODE -eq 0) { Write-Output 'DOCKER_READY=true' } else { Write-Output 'DOCKER_READY=false' } } else { Write-Output 'DOCKER_INSTALLED=false'; Write-Output 'DOCKER_READY=false' };",
      "Write-Output '__DOCKER_END__';",
      "Write-Output '__AGENT_START__';",
      "if ((Test-NetConnection 127.0.0.1 -Port 18080 -InformationLevel Quiet)) { Write-Output 'AGENT_PORT_OPEN=true' } else { Write-Output 'AGENT_PORT_OPEN=false' };",
      "Write-Output '__AGENT_END__'",
      "\""
    ].join(" ");
  }

  if (expectedOs === "macos") {
    return [
      "printf '__OS_START__\\n';",
      "sw_vers -productName 2>/dev/null; sw_vers -productVersion 2>/dev/null; uname -a;",
      "printf '\\n__OS_END__\\n';",
      "printf '__DOCKER_START__\\n';",
      "if command -v docker >/dev/null 2>&1; then docker --version; docker info >/dev/null 2>&1 && printf 'DOCKER_READY=true\\n' || printf 'DOCKER_READY=false\\n'; else printf 'DOCKER_INSTALLED=false\\nDOCKER_READY=false\\n'; fi;",
      "printf '__DOCKER_END__\\n';",
      "printf '__AGENT_START__\\n';",
      "if lsof -iTCP:18080 -sTCP:LISTEN >/dev/null 2>&1; then printf 'AGENT_PORT_OPEN=true\\n'; else printf 'AGENT_PORT_OPEN=false\\n'; fi;",
      "printf '__AGENT_END__\\n'"
    ].join(" ");
  }

  return [
    "printf '__OS_START__\\n';",
    "cat /etc/os-release 2>/dev/null || uname -a;",
    "printf '\\n__OS_END__\\n';",
    "printf '__DOCKER_START__\\n';",
    "if command -v docker >/dev/null 2>&1; then docker --version; docker info >/dev/null 2>&1 && printf 'DOCKER_READY=true\\n' || printf 'DOCKER_READY=false\\n'; else printf 'DOCKER_INSTALLED=false\\nDOCKER_READY=false\\n'; fi;",
    "printf '__DOCKER_END__\\n';",
    "printf '__AGENT_START__\\n';",
    "if (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':18080 ') || (command -v netstat >/dev/null 2>&1 && netstat -ltn | grep -q ':18080 ') || (command -v lsof >/dev/null 2>&1 && lsof -iTCP:18080 -sTCP:LISTEN >/dev/null 2>&1); then printf 'AGENT_PORT_OPEN=true\\n'; else printf 'AGENT_PORT_OPEN=false\\n'; fi;",
    "printf '__AGENT_END__\\n'"
  ].join(" ");
}

export function extractSection(output: string, section: string) {
  const start = `__${section}_START__`;
  const end = `__${section}_END__`;
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
  const dockerSection = extractSection(output, "DOCKER").toLowerCase();
  return dockerSection.includes("docker version") || dockerSection.includes("docker_installed=true");
}

export function isDockerReady(output: string) {
  return extractSection(output, "DOCKER").toLowerCase().includes("docker_ready=true");
}

export function isAgentPortOpen(output: string) {
  return extractSection(output, "AGENT").toLowerCase().includes("agent_port_open=true");
}
