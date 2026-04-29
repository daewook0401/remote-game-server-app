export const REMOTE_AGENT_DEFAULTS = {
  installDir: "/opt/remote-game-agent",
  serviceName: "remote-game-agent",
  binaryName: "agent",
  dataDirName: "data",
  envFileName: ".env",
  bindHost: "0.0.0.0",
  port: 18080,
  dockerMode: "cli",
  dockerPath: "docker"
} as const;

export const REMOTE_AGENT_PATHS = {
  dataDir: `${REMOTE_AGENT_DEFAULTS.installDir}/${REMOTE_AGENT_DEFAULTS.dataDirName}`,
  binary: `${REMOTE_AGENT_DEFAULTS.installDir}/${REMOTE_AGENT_DEFAULTS.binaryName}`,
  binaryTemp: `${REMOTE_AGENT_DEFAULTS.installDir}/${REMOTE_AGENT_DEFAULTS.binaryName}.new`,
  envFile: `${REMOTE_AGENT_DEFAULTS.installDir}/${REMOTE_AGENT_DEFAULTS.envFileName}`,
  serviceFile: `/etc/systemd/system/${REMOTE_AGENT_DEFAULTS.serviceName}.service`,
  stateFile: `${REMOTE_AGENT_DEFAULTS.installDir}/${REMOTE_AGENT_DEFAULTS.dataDirName}/servers.json`,
  nohupLogFile: "/tmp/remote-game-agent.log"
} as const;

export const REMOTE_TEMP_FILES = {
  dockerInfo: "/tmp/remote-game-agent-docker-info.out"
} as const;

export const HAPROXY_DEFAULTS = {
  configPath: "/etc/haproxy/haproxy.cfg",
  backupSuffix: ".remote-game-server.bak",
  managedMarkerPrefix: "remote-game-server",
  applyTempPrefix: "/tmp/remote-game-server-haproxy",
  removeTempPrefix: "/tmp/remote-game-server-haproxy-remove"
} as const;
