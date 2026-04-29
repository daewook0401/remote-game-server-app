import type { AgentPrepareRequest, AgentRemoveRequest } from "../types.js";
import { AGENT_SENTINELS } from "../commands/sentinels.js";
import { agentPrepareCommand, agentRemoveCommand } from "../ssh/bootstrapScripts.js";
import { runSshCommand, runSshCommandWithInput } from "../ssh/sshClient.js";

export async function prepareAgent(request: AgentPrepareRequest) {
  const command = agentPrepareCommand(request);
  const output = request.authMethod === "password" && request.password
    ? await runSshCommandWithInput(request, command, `${request.password}\n`)
    : await runSshCommand(request, command);

  return {
    installed: output.includes(AGENT_SENTINELS.installedTrue),
    started: output.includes(AGENT_SENTINELS.startedTrue),
    agentPortOpen: output.includes(AGENT_SENTINELS.portOpenTrue),
    firewallOpened: output.includes(AGENT_SENTINELS.firewallOpened),
    output
  };
}

export async function removeAgent(request: AgentRemoveRequest) {
  const command = agentRemoveCommand({ closeAgentFirewallPort: request.closeAgentFirewallPort });
  const output = request.authMethod === "password" && request.password
    ? await runSshCommandWithInput(request, command, `${request.password}\n`)
    : await runSshCommand(request, command);

  return {
    removed: output.includes(AGENT_SENTINELS.removedTrue),
    firewallClosed: output.includes(AGENT_SENTINELS.firewallClosedTrue),
    output
  };
}
