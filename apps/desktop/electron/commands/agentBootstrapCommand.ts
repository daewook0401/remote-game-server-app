import type { AgentPrepareRequest } from "../types.js";
import { buildDownloadToFileCommands } from "./downloadFragments.js";
import { buildProxyFirewallCloseCommands, buildProxyFirewallOpenCommands } from "./firewallFragments.js";
import { AGENT_SENTINELS } from "./sentinels.js";
import { shellSingleQuote } from "./shellQuote.js";
import { buildSystemdServiceContent, systemctlAvailable } from "./systemdFragments.js";
import { REMOTE_AGENT_DEFAULTS, REMOTE_AGENT_PATHS } from "../config/remoteDefaults.js";

function buildAgentEnvContent(token: string) {
  return [
    `AGENT_TOKEN=${token}`,
    `AGENT_ADDR=${REMOTE_AGENT_DEFAULTS.bindHost}:${REMOTE_AGENT_DEFAULTS.port}`,
    `AGENT_DOCKER_MODE=${REMOTE_AGENT_DEFAULTS.dockerMode}`,
    `AGENT_DOCKER_PATH=${REMOTE_AGENT_DEFAULTS.dockerPath}`,
    `AGENT_STATE_FILE=${REMOTE_AGENT_PATHS.stateFile}`,
    ""
  ].join("\n");
}

function buildAgentServiceContent() {
  return buildSystemdServiceContent({
    description: "OpenServerHub Agent",
    after: ["network.target", "docker.service"],
    workingDirectory: REMOTE_AGENT_DEFAULTS.installDir,
    environmentFile: REMOTE_AGENT_PATHS.envFile,
    execStart: REMOTE_AGENT_PATHS.binary
  });
}

function buildAgentFirewallOpenCommands() {
  return [
    ...buildProxyFirewallOpenCommands([{ port: REMOTE_AGENT_DEFAULTS.port, protocol: "tcp" }]),
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;"
  ];
}

function buildAgentFirewallCloseCommands(closeAgentFirewallPort: boolean) {
  if (!closeAgentFirewallPort) {
    return [`echo '${AGENT_SENTINELS.firewallClosedFalse}';`];
  }

  return [
    ...buildProxyFirewallCloseCommands([{ port: REMOTE_AGENT_DEFAULTS.port, protocol: "tcp" }]),
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;",
    `echo '${AGENT_SENTINELS.firewallClosedTrue}';`
  ];
}

export function agentPrepareCommand(request: AgentPrepareRequest) {
  if (request.expectedOs === "windows" || request.expectedOs === "macos") {
    throw new Error("현재 Agent 자동 준비는 Linux 서버만 지원합니다.");
  }

  const token = request.agentToken ?? "";
  const envContent = buildAgentEnvContent(token);
  const serviceContent = buildAgentServiceContent();

  return [
    "set -eu;",
    `AGENT_DIR=${REMOTE_AGENT_DEFAULTS.installDir};`,
    "AGENT_BIN=$AGENT_DIR/agent;",
    "AGENT_TMP=$AGENT_DIR/agent.new;",
    "AGENT_DATA_DIR=$AGENT_DIR/data;",
    `SERVICE_FILE=${REMOTE_AGENT_PATHS.serviceFile};`,
    `DOWNLOAD_URL=${shellSingleQuote(request.downloadUrl)};`,
    "if [ \"$(id -u)\" -ne 0 ]; then SUDO='sudo -S'; else SUDO=; fi;",
    "$SUDO mkdir -p $AGENT_DIR;",
    "$SUDO mkdir -p $AGENT_DATA_DIR;",
    ...buildDownloadToFileCommands({
      downloadUrlVariable: "DOWNLOAD_URL",
      outputPathVariable: "AGENT_TMP",
      missingToolSentinel: AGENT_SENTINELS.downloadToolMissing
    }),
    `echo '${AGENT_SENTINELS.downloaded}';`,
    "$SUDO chmod +x $AGENT_TMP;",
    `printf %s ${shellSingleQuote(envContent)} | $SUDO tee $AGENT_DIR/.env >/dev/null;`,
    `if ${systemctlAvailable()}; then`,
    `  printf %s ${shellSingleQuote(serviceContent)} | $SUDO tee $SERVICE_FILE >/dev/null;`,
    "  $SUDO systemctl daemon-reload;",
    `  $SUDO systemctl enable ${REMOTE_AGENT_DEFAULTS.serviceName} >/dev/null 2>&1 || true;`,
    `  $SUDO systemctl stop ${REMOTE_AGENT_DEFAULTS.serviceName} >/dev/null 2>&1 || true;`,
    "  $SUDO mv $AGENT_TMP $AGENT_BIN;",
    `  $SUDO systemctl restart ${REMOTE_AGENT_DEFAULTS.serviceName};`,
    "  sleep 1;",
    "else",
    "  pkill -f \"$AGENT_BIN\" >/dev/null 2>&1 || true;",
    "  $SUDO mv $AGENT_TMP $AGENT_BIN;",
    `  nohup sh -c "cd $AGENT_DIR && . ./.env && exec $AGENT_BIN" >${REMOTE_AGENT_PATHS.nohupLogFile} 2>&1 &`,
    "  sleep 1;",
    "fi;",
    ...buildAgentFirewallOpenCommands(),
    `echo '${AGENT_SENTINELS.firewallOpened}';`,
    `if [ -f $AGENT_BIN ]; then echo '${AGENT_SENTINELS.installedTrue}'; else echo '${AGENT_SENTINELS.installedFalse}'; fi;`,
    `if (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':${REMOTE_AGENT_DEFAULTS.port} ') || (command -v netstat >/dev/null 2>&1 && netstat -ltn | grep -q ':${REMOTE_AGENT_DEFAULTS.port} ') || (command -v lsof >/dev/null 2>&1 && lsof -iTCP:${REMOTE_AGENT_DEFAULTS.port} -sTCP:LISTEN >/dev/null 2>&1); then echo '${AGENT_SENTINELS.portOpenTrue}'; echo '${AGENT_SENTINELS.startedTrue}'; else echo '${AGENT_SENTINELS.portOpenFalse}'; echo '${AGENT_SENTINELS.startedFalse}'; fi;`
  ].join(" ");
}

export function agentRemoveCommand(request: { closeAgentFirewallPort: boolean }) {
  return [
    "set -u;",
    `AGENT_DIR=${REMOTE_AGENT_DEFAULTS.installDir};`,
    `SERVICE_FILE=${REMOTE_AGENT_PATHS.serviceFile};`,
    "if [ \"$(id -u)\" -ne 0 ]; then SUDO='sudo -S'; else SUDO=; fi;",
    `if ${systemctlAvailable()}; then`,
    `  $SUDO systemctl stop ${REMOTE_AGENT_DEFAULTS.serviceName} >/dev/null 2>&1 || true;`,
    `  $SUDO systemctl disable ${REMOTE_AGENT_DEFAULTS.serviceName} >/dev/null 2>&1 || true;`,
    "fi;",
    "pkill -f \"$AGENT_DIR/agent\" >/dev/null 2>&1 || true;",
    "$SUDO rm -f $SERVICE_FILE;",
    `if ${systemctlAvailable()}; then $SUDO systemctl daemon-reload >/dev/null 2>&1 || true; fi;`,
    ...buildAgentFirewallCloseCommands(request.closeAgentFirewallPort),
    "$SUDO rm -rf $AGENT_DIR;",
    `if [ ! -e $SERVICE_FILE ] && [ ! -d $AGENT_DIR ]; then echo '${AGENT_SENTINELS.removedTrue}'; else echo '${AGENT_SENTINELS.removedFalse}'; fi;`
  ].join(" ");
}
