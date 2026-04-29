export const AGENT_SENTINELS = {
  downloadToolMissing: "DOWNLOAD_TOOL_MISSING=true",
  downloaded: "AGENT_DOWNLOADED=true",
  firewallOpened: "AGENT_FIREWALL_OPENED=true",
  firewallClosedTrue: "AGENT_FIREWALL_CLOSED=true",
  firewallClosedFalse: "AGENT_FIREWALL_CLOSED=false",
  installedTrue: "AGENT_INSTALLED=true",
  installedFalse: "AGENT_INSTALLED=false",
  portOpenTrue: "AGENT_PORT_OPEN=true",
  portOpenFalse: "AGENT_PORT_OPEN=false",
  startedTrue: "AGENT_STARTED=true",
  startedFalse: "AGENT_STARTED=false",
  removedTrue: "AGENT_REMOVED=true",
  removedFalse: "AGENT_REMOVED=false"
} as const;

export const HAPROXY_SENTINELS = {
  installedTrue: "HAPROXY_INSTALLED=true",
  installedFalse: "HAPROXY_INSTALLED=false",
  installAttempted: "HAPROXY_INSTALL_ATTEMPTED=true",
  packageManagerUnsupported: "HAPROXY_PACKAGE_MANAGER_UNSUPPORTED=true",
  osIdPrefix: "HAPROXY_OS_ID=",
  osLikePrefix: "HAPROXY_OS_LIKE=",
  udpSupportedTrue: "HAPROXY_UDP_SUPPORTED=true",
  udpSupportedFalse: "HAPROXY_UDP_SUPPORTED=false",
  applied: "HAPROXY_APPLIED=true",
  firewallOpened: "HAPROXY_FIREWALL_OPENED=true",
  removed: "HAPROXY_REMOVED=true",
  reloadedTrue: "HAPROXY_RELOADED=true",
  reloadedFalse: "HAPROXY_RELOADED=false"
} as const;

export const FIREWALL_SENTINELS = {
  ok: "FIREWALL_OK",
  guide: "FIREWALL_GUIDE"
} as const;

export const DETECTION_SECTIONS = {
  os: "OS",
  docker: "DOCKER",
  agent: "AGENT"
} as const;

export const DETECTION_MARKERS = {
  osStart: "__OS_START__",
  osEnd: "__OS_END__",
  dockerStart: "__DOCKER_START__",
  dockerEnd: "__DOCKER_END__",
  agentStart: "__AGENT_START__",
  agentEnd: "__AGENT_END__"
} as const;

export const DETECTION_SENTINELS = {
  dockerInstalledTrue: "DOCKER_INSTALLED=true",
  dockerInstalledFalse: "DOCKER_INSTALLED=false",
  dockerDaemonTrue: "DOCKER_DAEMON=true",
  dockerDaemonFalse: "DOCKER_DAEMON=false",
  dockerPermissionTrue: "DOCKER_PERMISSION=true",
  dockerPermissionFalse: "DOCKER_PERMISSION=false",
  dockerPermissionUnknown: "DOCKER_PERMISSION=unknown",
  dockerReadyTrue: "DOCKER_READY=true",
  dockerReadyFalse: "DOCKER_READY=false",
  agentPortOpenTrue: AGENT_SENTINELS.portOpenTrue,
  agentPortOpenFalse: AGENT_SENTINELS.portOpenFalse
} as const;

export function detectionSectionStart(section: string) {
  return `__${section}_START__`;
}

export function detectionSectionEnd(section: string) {
  return `__${section}_END__`;
}
