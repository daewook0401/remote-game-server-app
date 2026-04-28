import type { AgentPrepareRequest } from "../types.js";

function shellSingleQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function agentPrepareCommand(request: AgentPrepareRequest) {
  if (request.expectedOs === "windows" || request.expectedOs === "macos") {
    throw new Error("현재 Agent 자동 준비는 Linux 서버만 지원합니다.");
  }

  const token = request.agentToken ?? "";
  const envContent = [
    `AGENT_TOKEN=${token}`,
    "AGENT_ADDR=0.0.0.0:18080",
    "AGENT_DOCKER_MODE=cli",
    "AGENT_DOCKER_PATH=docker",
    ""
  ].join("\n");
  const serviceContent = [
    "[Unit]",
    "Description=Remote Game Server Agent",
    "After=network.target docker.service",
    "",
    "[Service]",
    "WorkingDirectory=/opt/remote-game-agent",
    "EnvironmentFile=/opt/remote-game-agent/.env",
    "ExecStart=/opt/remote-game-agent/agent",
    "Restart=always",
    "RestartSec=3",
    "",
    "[Install]",
    "WantedBy=multi-user.target",
    ""
  ].join("\n");

  return [
    "set -eu;",
    "AGENT_DIR=/opt/remote-game-agent;",
    "AGENT_BIN=$AGENT_DIR/agent;",
    "AGENT_TMP=$AGENT_DIR/agent.new;",
    "SERVICE_FILE=/etc/systemd/system/remote-game-agent.service;",
    `DOWNLOAD_URL=${shellSingleQuote(request.downloadUrl)};`,
    "if [ \"$(id -u)\" -ne 0 ]; then SUDO='sudo -S'; else SUDO=; fi;",
    "$SUDO mkdir -p $AGENT_DIR;",
    "if command -v curl >/dev/null 2>&1; then $SUDO curl -fsSL \"$DOWNLOAD_URL\" -o $AGENT_TMP;",
    "elif command -v wget >/dev/null 2>&1; then $SUDO wget -q \"$DOWNLOAD_URL\" -O $AGENT_TMP;",
    "else echo 'DOWNLOAD_TOOL_MISSING=true'; exit 12;",
    "fi;",
    "echo 'AGENT_DOWNLOADED=true';",
    "$SUDO chmod +x $AGENT_TMP;",
    `printf %s ${shellSingleQuote(envContent)} | $SUDO tee $AGENT_DIR/.env >/dev/null;`,
    "if command -v systemctl >/dev/null 2>&1; then",
    `  printf %s ${shellSingleQuote(serviceContent)} | $SUDO tee $SERVICE_FILE >/dev/null;`,
    "  $SUDO systemctl daemon-reload;",
    "  $SUDO systemctl enable remote-game-agent >/dev/null 2>&1 || true;",
    "  $SUDO systemctl stop remote-game-agent >/dev/null 2>&1 || true;",
    "  $SUDO mv $AGENT_TMP $AGENT_BIN;",
    "  $SUDO systemctl restart remote-game-agent;",
    "  sleep 1;",
    "else",
    "  pkill -f \"$AGENT_BIN\" >/dev/null 2>&1 || true;",
    "  $SUDO mv $AGENT_TMP $AGENT_BIN;",
    "  nohup sh -c \"cd $AGENT_DIR && . ./.env && exec $AGENT_BIN\" >/tmp/remote-game-agent.log 2>&1 &",
    "  sleep 1;",
    "fi;",
    "if [ -f $AGENT_BIN ]; then echo 'AGENT_INSTALLED=true'; else echo 'AGENT_INSTALLED=false'; fi;",
    "if (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':18080 ') || (command -v netstat >/dev/null 2>&1 && netstat -ltn | grep -q ':18080 ') || (command -v lsof >/dev/null 2>&1 && lsof -iTCP:18080 -sTCP:LISTEN >/dev/null 2>&1); then echo 'AGENT_PORT_OPEN=true'; echo 'AGENT_STARTED=true'; else echo 'AGENT_PORT_OPEN=false'; echo 'AGENT_STARTED=false'; fi;"
  ].join(" ");
}
