import type { HaproxyApplyRequest, HaproxyPortRoute, HaproxyRemoveRequest, HaproxySshRequest } from "../types.js";

function shellSingleQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function aclLine(route: HaproxyPortRoute) {
  if (!route.allowedCidrs?.trim()) {
    return "";
  }

  const cidrs = route.allowedCidrs
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ");

  return cidrs ? `    tcp-request connection reject if !{ src ${cidrs} }\n` : "";
}

function splitCidrs(value?: string) {
  return value
    ?.split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean) ?? [];
}

function tcpRouteBlock(serverId: string, route: HaproxyPortRoute) {
  const safeServerId = sanitizeId(serverId);
  const safeRouteId = sanitizeId(route.id);
  const prefix = `rg_${route.purpose}_${safeServerId}_${safeRouteId}`;

  return [
    `frontend ${prefix}`,
    `    bind 0.0.0.0:${route.externalPort}`,
    "    mode tcp",
    aclLine(route).trimEnd(),
    `    default_backend ${prefix}_backend`,
    "",
    `backend ${prefix}_backend`,
    "    mode tcp",
    "    option tcp-check",
    `    server target_${safeRouteId} ${route.targetHost}:${route.targetPort} check`,
    ""
  ].filter((line) => line.length > 0).join("\n");
}

function routeBlock(serverId: string, route: HaproxyPortRoute) {
  if (route.protocol === "udp") {
    return [
      `# UDP route ${route.id} is intentionally not rendered by the generic template.`,
      "# The installed HAProxy must expose a supported UDP module/template before this route can be applied.",
      ""
    ].join("\n");
  }

  return tcpRouteBlock(serverId, route);
}

export function haproxyStatusCommand() {
  return [
    "set -u;",
    "if command -v haproxy >/dev/null 2>&1; then",
    "  echo 'HAPROXY_INSTALLED=true';",
    "  haproxy -vv 2>&1 || true;",
    "else",
    "  echo 'HAPROXY_INSTALLED=false';",
    "fi;"
  ].join(" ");
}

function sudoPrefix(request: HaproxySshRequest) {
  return request.sudoPassword || (request.authMethod === "password" && request.password) ? "sudo -S" : "sudo -n";
}

function firewallOpenCommands(routes: HaproxyPortRoute[]) {
  return routes.flatMap((route) => {
    const protocol = route.protocol;
    const cidrs = splitCidrs(route.allowedCidrs);

    if (!cidrs.length) {
      return [
        `if command -v ufw >/dev/null 2>&1; then $SUDO ufw allow ${route.externalPort}/${protocol} >/dev/null 2>&1 || true; fi;`,
        `if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --permanent --add-port=${route.externalPort}/${protocol} >/dev/null 2>&1 || true; fi;`
      ];
    }

    return cidrs.flatMap((cidr) => {
      const richRule = `rule source address="${cidr}" port port="${route.externalPort}" protocol="${protocol}" accept`;

      return [
        `if command -v ufw >/dev/null 2>&1; then $SUDO ufw allow from ${shellSingleQuote(cidr)} to any port ${route.externalPort} proto ${protocol} >/dev/null 2>&1 || true; fi;`,
        `if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --permanent --add-rich-rule=${shellSingleQuote(richRule)} >/dev/null 2>&1 || true; fi;`
      ];
    });
  });
}

function uniqueTargetHosts(routes: HaproxyPortRoute[]) {
  return Array.from(new Set(routes.map((route) => route.targetHost.trim()).filter(Boolean)));
}

export function haproxyInstallCommand(request: HaproxySshRequest) {
  const sudo = sudoPrefix(request);

  return [
    "set -eu;",
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    "OS_ID=unknown;",
    "OS_LIKE=;",
    "if [ -r /etc/os-release ]; then . /etc/os-release; OS_ID=${ID:-unknown}; OS_LIKE=${ID_LIKE:-}; fi;",
    "echo \"HAPROXY_OS_ID=$OS_ID\";",
    "echo \"HAPROXY_OS_LIKE=$OS_LIKE\";",
    "if command -v haproxy >/dev/null 2>&1; then echo 'HAPROXY_INSTALLED=true'; haproxy -vv 2>&1 || true; exit 0; fi;",
    "echo 'HAPROXY_INSTALL_ATTEMPTED=true';",
    "if command -v apt-get >/dev/null 2>&1; then",
    "  $SUDO apt-get update;",
    "  DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y haproxy;",
    "elif command -v dnf >/dev/null 2>&1; then",
    "  $SUDO dnf install -y haproxy;",
    "elif command -v yum >/dev/null 2>&1; then",
    "  $SUDO yum install -y haproxy;",
    "elif command -v pacman >/dev/null 2>&1; then",
    "  $SUDO pacman -Sy --noconfirm haproxy;",
    "elif command -v zypper >/dev/null 2>&1; then",
    "  $SUDO zypper --non-interactive install haproxy;",
    "elif command -v apk >/dev/null 2>&1; then",
    "  $SUDO apk add --no-cache haproxy;",
    "else",
    "  echo 'HAPROXY_PACKAGE_MANAGER_UNSUPPORTED=true';",
    "  exit 22;",
    "fi;",
    "if command -v systemctl >/dev/null 2>&1; then",
    "  $SUDO systemctl enable haproxy >/dev/null 2>&1 || true;",
    "  $SUDO systemctl start haproxy >/dev/null 2>&1 || true;",
    "fi;",
    "if command -v haproxy >/dev/null 2>&1; then echo 'HAPROXY_INSTALLED=true'; haproxy -vv 2>&1 || true; else echo 'HAPROXY_INSTALLED=false'; exit 23; fi;"
  ].join(" ");
}

export function haproxyApplyCommand(request: HaproxyApplyRequest) {
  const sudo = sudoPrefix(request);
  const hasUdpRoute = request.routes.some((route) => route.protocol === "udp");
  const firewallCommands = firewallOpenCommands(request.routes);
  const targetHosts = uniqueTargetHosts(request.routes).join(" ");
  const block = [
    `# BEGIN remote-game-server ${request.serverId}`,
    ...request.routes.map((route) => routeBlock(request.serverId, route)),
    `# END remote-game-server ${request.serverId}`,
    ""
  ].join("\n");

  return [
    "set -eu;",
    "CFG=/etc/haproxy/haproxy.cfg;",
    `SERVER_ID=${shellSingleQuote(request.serverId)};`,
    `TARGET_HOSTS=${shellSingleQuote(targetHosts)};`,
    `MANAGED_BLOCK=${shellSingleQuote(block)};`,
    "BEGIN_MARKER=\"# BEGIN remote-game-server $SERVER_ID\";",
    "END_MARKER=\"# END remote-game-server $SERVER_ID\";",
    "TMP=/tmp/remote-game-server-haproxy-$SERVER_ID.cfg;",
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    "if ! command -v haproxy >/dev/null 2>&1; then echo 'HAPROXY_INSTALLED=false'; exit 20; fi;",
    "HAPROXY_VERSION_OUTPUT=$(haproxy -vv 2>&1 || true);",
    "echo 'HAPROXY_INSTALLED=true';",
    "printf '%s\\n' \"$HAPROXY_VERSION_OUTPUT\";",
    hasUdpRoute
      ? "if printf '%s\\n' \"$HAPROXY_VERSION_OUTPUT\" | grep -Eiq 'udp-lb|udp module|enterprise|hapee'; then echo 'HAPROXY_UDP_SUPPORTED=true'; else echo 'HAPROXY_UDP_SUPPORTED=false'; exit 21; fi;"
      : "if printf '%s\\n' \"$HAPROXY_VERSION_OUTPUT\" | grep -Eiq 'udp-lb|udp module|enterprise|hapee'; then echo 'HAPROXY_UDP_SUPPORTED=true'; else echo 'HAPROXY_UDP_SUPPORTED=false'; fi;",
    "$SUDO test -f $CFG;",
    "awk -v begin=\"$BEGIN_MARKER\" -v end=\"$END_MARKER\" -v target_hosts=\"$TARGET_HOSTS\" '",
    "  BEGIN { split(target_hosts, hosts, \" \"); in_block=0; block=\"\"; }",
    "  function matches_target(i) { if (block ~ begin || block ~ end) return 1; for (i in hosts) if (hosts[i] != \"\" && index(block, hosts[i] \":\") > 0) return 1; return 0; }",
    "  /^# BEGIN remote-game-server / { in_block=1; block=$0 ORS; next }",
    "  in_block == 1 { block=block $0 ORS; if ($0 ~ /^# END remote-game-server /) { if (!matches_target()) printf \"%s\", block; in_block=0; block=\"\"; } next }",
    "  { print }",
    "  END { if (in_block == 1 && !matches_target()) printf \"%s\", block }",
    "' $CFG > $TMP;",
    "printf '%s\\n' \"$MANAGED_BLOCK\" >> $TMP;",
    "$SUDO haproxy -c -f $TMP;",
    "$SUDO cp $CFG $CFG.remote-game-server.bak;",
    "$SUDO cp $TMP $CFG;",
    "if command -v systemctl >/dev/null 2>&1; then $SUDO systemctl reload haproxy || $SUDO systemctl restart haproxy; fi;",
    ...firewallCommands,
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;",
    "echo 'HAPROXY_APPLIED=true';",
    "echo 'HAPROXY_FIREWALL_OPENED=true';",
    "echo 'HAPROXY_RELOADED=true';"
  ].join(" ");
}

export function haproxyRemoveCommand(request: HaproxyRemoveRequest) {
  const sudo = sudoPrefix(request);
  const targetHosts = (request.targetHosts ?? []).map((host) => host.trim()).filter(Boolean).join(" ");
  const requestedRouteIds = (request.routeIds ?? []).map((routeId) => sanitizeId(routeId.trim())).filter(Boolean);
  const routeIds = requestedRouteIds.join(" ");
  const routeFilterEnabled = requestedRouteIds.length > 0 ? "true" : "false";
  const firewallCommands = request.closePorts.flatMap((item) => {
    const protocol = item.protocol;
    const cidrs = splitCidrs(item.allowedCidrs);

    if (!cidrs.length) {
      return [
        `if command -v ufw >/dev/null 2>&1; then $SUDO ufw delete allow ${item.port}/${protocol} >/dev/null 2>&1 || true; fi;`,
        `if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --permanent --remove-port=${item.port}/${protocol} >/dev/null 2>&1 || true; fi;`
      ];
    }

    return cidrs.flatMap((cidr) => {
      const richRule = `rule source address="${cidr}" port port="${item.port}" protocol="${protocol}" accept`;

      return [
        `if command -v ufw >/dev/null 2>&1; then $SUDO ufw delete allow from ${shellSingleQuote(cidr)} to any port ${item.port} proto ${protocol} >/dev/null 2>&1 || true; fi;`,
        `if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --permanent --remove-rich-rule=${shellSingleQuote(richRule)} >/dev/null 2>&1 || true; fi;`
      ];
    });
  });

  return [
    "set -u;",
    "CFG=/etc/haproxy/haproxy.cfg;",
    `SERVER_ID=${shellSingleQuote(request.serverId)};`,
    `TARGET_HOSTS=${shellSingleQuote(targetHosts)};`,
    `ROUTE_IDS=${shellSingleQuote(routeIds)};`,
    `ROUTE_FILTER_ENABLED=${shellSingleQuote(routeFilterEnabled)};`,
    "BEGIN_MARKER=\"# BEGIN remote-game-server $SERVER_ID\";",
    "END_MARKER=\"# END remote-game-server $SERVER_ID\";",
    "TMP=/tmp/remote-game-server-haproxy-remove-$SERVER_ID.cfg;",
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    "if ! command -v haproxy >/dev/null 2>&1; then echo 'HAPROXY_REMOVED=true'; echo 'HAPROXY_RELOADED=false'; exit 0; fi;",
    "awk -v begin=\"$BEGIN_MARKER\" -v end=\"$END_MARKER\" -v target_hosts=\"$TARGET_HOSTS\" -v route_ids=\"$ROUTE_IDS\" -v route_filter=\"$ROUTE_FILTER_ENABLED\" '",
    "  BEGIN { split(target_hosts, hosts, \" \"); split(route_ids, routes, \" \"); route_count=split(route_ids, routes, \" \"); in_block=0; block=\"\"; }",
    "  function matches_target(i) { if (block ~ begin || block ~ end) return 1; for (i in hosts) if (hosts[i] != \"\" && index(block, hosts[i] \":\") > 0) return 1; return 0; }",
    "  function route_line_matches(line, i) { for (i=1; i<=route_count; i++) if (routes[i] != \"\" && index(line, routes[i]) > 0) return 1; return 0; }",
    "  function print_filtered_block(    lines,count,i,line,drop,changed) {",
    "    count=split(block, lines, ORS); drop=0; changed=0;",
    "    for (i=1; i<=count; i++) {",
    "      line=lines[i];",
    "      if (line == \"\") continue;",
    "      if (line ~ /^frontend / || line ~ /^backend /) { drop=route_line_matches(line); if (drop) changed=1; }",
    "      if (!drop) print line;",
    "    }",
    "  }",
    "  /^# BEGIN remote-game-server / { in_block=1; block=$0 ORS; next }",
    "  in_block == 1 { block=block $0 ORS; if ($0 ~ /^# END remote-game-server /) { if (!matches_target()) printf \"%s\", block; else if (route_filter == \"true\") print_filtered_block(); in_block=0; block=\"\"; } next }",
    "  { print }",
    "  END { if (in_block == 1) { if (!matches_target()) printf \"%s\", block; else if (route_filter == \"true\") print_filtered_block(); } }",
    "' $CFG > $TMP;",
    "$SUDO haproxy -c -f $TMP;",
    "$SUDO cp $CFG $CFG.remote-game-server.bak;",
    "$SUDO cp $TMP $CFG;",
    "if command -v systemctl >/dev/null 2>&1; then $SUDO systemctl reload haproxy || $SUDO systemctl restart haproxy; fi;",
    ...firewallCommands,
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;",
    "echo 'HAPROXY_REMOVED=true';",
    "echo 'HAPROXY_RELOADED=true';"
  ].join(" ");
}
