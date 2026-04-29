import type { FirewallClosePortRequest } from "../types.js";
import { FIREWALL_SENTINELS } from "./sentinels.js";
import { commandExists, portProtocol, type ShellProtocol } from "./shellFragments.js";
import { shellSingleQuote } from "./shellQuote.js";

export interface FirewallPortRule {
  port: number;
  protocol: ShellProtocol;
  allowedCidrs?: string;
}

export function splitCidrs(value?: string) {
  return value
    ?.split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean) ?? [];
}

export function buildFirewallOpenScript(port: number, protocol: ShellProtocol) {
  return `
set -eu
PORT=${port}
PROTOCOL=${protocol}

if ${commandExists("ufw")}; then
  ufw allow "$PORT/$PROTOCOL"
  if ufw status | grep -qi inactive; then
    echo "${FIREWALL_SENTINELS.ok} method=ufw message=rule-added-ufw-inactive"
  else
    ufw reload || true
    echo "${FIREWALL_SENTINELS.ok} method=ufw message=rule-added"
  fi
elif ${commandExists("firewall-cmd")}; then
  firewall-cmd --permanent --add-port="$PORT/$PROTOCOL"
  firewall-cmd --reload
  echo "${FIREWALL_SENTINELS.ok} method=firewalld message=rule-added"
elif ${commandExists("iptables")}; then
  iptables -C INPUT -p "$PROTOCOL" --dport "$PORT" -j ACCEPT 2>/dev/null || iptables -I INPUT -p "$PROTOCOL" --dport "$PORT" -j ACCEPT
  echo "${FIREWALL_SENTINELS.ok} method=iptables message=runtime-rule-added"
else
  echo "${FIREWALL_SENTINELS.guide} method=manual message=no-supported-firewall"
  exit 2
fi
`;
}

export function buildFirewallCloseScript(port: number, protocol: ShellProtocol, closeMode: FirewallClosePortRequest["closeMode"]) {
  const ufwCommand = closeMode === "deny" ? `ufw deny "$PORT/$PROTOCOL"` : `ufw delete allow "$PORT/$PROTOCOL" || true`;
  const firewalldCommand =
    closeMode === "deny"
      ? `echo "${FIREWALL_SENTINELS.guide} method=manual message=firewalld-deny-not-supported"; exit 2`
      : `firewall-cmd --permanent --remove-port="$PORT/$PROTOCOL" || true
  firewall-cmd --reload`;
  const iptablesCommand =
    closeMode === "deny"
      ? `iptables -C INPUT -p "$PROTOCOL" --dport "$PORT" -j DROP 2>/dev/null || iptables -I INPUT -p "$PROTOCOL" --dport "$PORT" -j DROP`
      : `iptables -D INPUT -p "$PROTOCOL" --dport "$PORT" -j ACCEPT 2>/dev/null || true`;

  return `
set -eu
PORT=${port}
PROTOCOL=${protocol}

if ${commandExists("ufw")}; then
  ${ufwCommand}
  if ufw status | grep -qi inactive; then
    echo "${FIREWALL_SENTINELS.ok} method=ufw message=rule-updated-ufw-inactive"
  else
    ufw reload || true
    echo "${FIREWALL_SENTINELS.ok} method=ufw message=rule-updated"
  fi
elif ${commandExists("firewall-cmd")}; then
  ${firewalldCommand}
  echo "${FIREWALL_SENTINELS.ok} method=firewalld message=rule-updated"
elif ${commandExists("iptables")}; then
  ${iptablesCommand}
  echo "${FIREWALL_SENTINELS.ok} method=iptables message=runtime-rule-updated"
else
  echo "${FIREWALL_SENTINELS.guide} method=manual message=no-supported-firewall"
  exit 2
fi
`;
}

export function buildProxyFirewallOpenCommands(routes: FirewallPortRule[]) {
  return routes.flatMap((route) => {
    const cidrs = splitCidrs(route.allowedCidrs);

    if (!cidrs.length) {
      return [
        `if ${commandExists("ufw")}; then $SUDO ufw allow ${portProtocol(route.port, route.protocol)} >/dev/null 2>&1 || true; fi;`,
        `if ${commandExists("firewall-cmd")}; then $SUDO firewall-cmd --permanent --add-port=${portProtocol(route.port, route.protocol)} >/dev/null 2>&1 || true; fi;`
      ];
    }

    return cidrs.flatMap((cidr) => {
      const richRule = `rule source address="${cidr}" port port="${route.port}" protocol="${route.protocol}" accept`;

      return [
        `if ${commandExists("ufw")}; then $SUDO ufw allow from ${shellSingleQuote(cidr)} to any port ${route.port} proto ${route.protocol} >/dev/null 2>&1 || true; fi;`,
        `if ${commandExists("firewall-cmd")}; then $SUDO firewall-cmd --permanent --add-rich-rule=${shellSingleQuote(richRule)} >/dev/null 2>&1 || true; fi;`
      ];
    });
  });
}

export function buildProxyFirewallCloseCommands(items: FirewallPortRule[]) {
  return items.flatMap((item) => {
    const cidrs = splitCidrs(item.allowedCidrs);

    if (!cidrs.length) {
      return [
        `if ${commandExists("ufw")}; then $SUDO ufw delete allow ${portProtocol(item.port, item.protocol)} >/dev/null 2>&1 || true; fi;`,
        `if ${commandExists("firewall-cmd")}; then $SUDO firewall-cmd --permanent --remove-port=${portProtocol(item.port, item.protocol)} >/dev/null 2>&1 || true; fi;`
      ];
    }

    return cidrs.flatMap((cidr) => {
      const richRule = `rule source address="${cidr}" port port="${item.port}" protocol="${item.protocol}" accept`;

      return [
        `if ${commandExists("ufw")}; then $SUDO ufw delete allow from ${shellSingleQuote(cidr)} to any port ${item.port} proto ${item.protocol} >/dev/null 2>&1 || true; fi;`,
        `if ${commandExists("firewall-cmd")}; then $SUDO firewall-cmd --permanent --remove-rich-rule=${shellSingleQuote(richRule)} >/dev/null 2>&1 || true; fi;`
      ];
    });
  });
}
