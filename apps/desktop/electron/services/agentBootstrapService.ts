import type { AgentPrepareRequest, AgentRemoveRequest } from "../types.js";
import { agentPrepareCommand, agentRemoveCommand } from "../ssh/bootstrapScripts.js";
import { runSshCommand, runSshCommandWithInput } from "../ssh/sshClient.js";

export async function prepareAgent(request: AgentPrepareRequest) {
  const command = agentPrepareCommand(request);
  const output = request.authMethod === "password" && request.password
    ? await runSshCommandWithInput(request, command, `${request.password}\n`)
    : await runSshCommand(request, command);

  return {
    installed: output.includes("AGENT_INSTALLED=true"),
    started: output.includes("AGENT_STARTED=true"),
    agentPortOpen: output.includes("AGENT_PORT_OPEN=true"),
    firewallOpened: output.includes("AGENT_FIREWALL_OPENED=true"),
    output
  };
}

export async function removeAgent(request: AgentRemoveRequest) {
  const command = agentRemoveCommand({ closeAgentFirewallPort: request.closeAgentFirewallPort });
  const output = request.authMethod === "password" && request.password
    ? await runSshCommandWithInput(request, command, `${request.password}\n`)
    : await runSshCommand(request, command);

  return {
    removed: output.includes("AGENT_REMOVED=true"),
    firewallClosed: output.includes("AGENT_FIREWALL_CLOSED=true"),
    output
  };
}
