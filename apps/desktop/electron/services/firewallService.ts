import { runSshCommandWithInput } from "../ssh/sshClient.js";
import type { FirewallOpenPortRequest, FirewallOpenPortResult } from "../types.js";

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function buildFirewallScript(port: number, protocol: "tcp" | "udp") {
  return `
set -eu
PORT=${port}
PROTOCOL=${protocol}

if command -v ufw >/dev/null 2>&1; then
  ufw allow "$PORT/$PROTOCOL"
  if ufw status | grep -qi inactive; then
    echo "FIREWALL_OK method=ufw message=rule-added-ufw-inactive"
  else
    ufw reload || true
    echo "FIREWALL_OK method=ufw message=rule-added"
  fi
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port="$PORT/$PROTOCOL"
  firewall-cmd --reload
  echo "FIREWALL_OK method=firewalld message=rule-added"
elif command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p "$PROTOCOL" --dport "$PORT" -j ACCEPT 2>/dev/null || iptables -I INPUT -p "$PROTOCOL" --dport "$PORT" -j ACCEPT
  echo "FIREWALL_OK method=iptables message=runtime-rule-added"
else
  echo "FIREWALL_GUIDE method=manual message=no-supported-firewall"
  exit 2
fi
`;
}

export async function openFirewallPort(request: FirewallOpenPortRequest): Promise<FirewallOpenPortResult> {
  if (!Number.isInteger(request.firewallPort) || request.firewallPort < 1 || request.firewallPort > 65535) {
    throw new Error("포트는 1부터 65535 사이의 숫자여야 합니다.");
  }

  if (request.authMethod !== "password" || !request.password || !request.sudoPassword) {
    throw new Error("자동 포트 설정은 SSH password 인증에서만 SSH 비밀번호를 sudo에 재사용할 수 있습니다.");
  }

  const script = buildFirewallScript(request.firewallPort, request.protocol);
  const command = `sudo -S -p "" sh -c ${shellQuote(script)}`;
  const output = await runSshCommandWithInput(request, command, `${request.sudoPassword}\n`);
  const methodMatch = output.match(/method=([a-zA-Z0-9_-]+)/);
  const messageMatch = output.match(/message=([a-zA-Z0-9_-]+)/);

  return {
    opened: output.includes("FIREWALL_OK"),
    method: methodMatch?.[1] ?? "unknown",
    message: messageMatch?.[1] ?? "포트 설정 명령을 실행했습니다.",
    output
  };
}
