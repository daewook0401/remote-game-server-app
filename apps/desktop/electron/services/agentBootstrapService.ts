import type { AgentPrepareRequest } from "../types.js";
import { agentPrepareCommand } from "../ssh/bootstrapScripts.js";
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
    output
  };
}
