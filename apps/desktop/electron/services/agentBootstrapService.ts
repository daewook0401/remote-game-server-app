import type { AgentPrepareRequest } from "../types.js";
import { agentPrepareCommand } from "../ssh/bootstrapScripts.js";
import { runSshCommand } from "../ssh/sshClient.js";

export async function prepareAgent(request: AgentPrepareRequest) {
  const output = await runSshCommand(request, agentPrepareCommand(request));

  return {
    installed: output.includes("AGENT_INSTALLED=true"),
    started: output.includes("AGENT_STARTED=true"),
    agentPortOpen: output.includes("AGENT_PORT_OPEN=true"),
    output
  };
}
