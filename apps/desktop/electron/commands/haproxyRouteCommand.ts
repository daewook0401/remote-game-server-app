import type { HaproxyApplyRequest, HaproxyPortRoute, HaproxyRemoveRequest } from "../types.js";
import { HAPROXY_DEFAULTS } from "../config/remoteDefaults.js";
import { buildProxyFirewallCloseCommands, buildProxyFirewallOpenCommands } from "./firewallFragments.js";
import { renderManagedBlock } from "./haproxyConfigRenderer.js";
import { haproxySudoPrefix } from "./haproxyInstallCommand.js";
import { HAPROXY_SENTINELS } from "./sentinels.js";
import { sanitizeShellIdentifier, shellSingleQuote } from "./shellQuote.js";

function uniqueTargetHosts(routes: HaproxyPortRoute[]) {
  return Array.from(new Set(routes.map((route) => route.targetHost.trim()).filter(Boolean)));
}

export function haproxyApplyCommand(request: HaproxyApplyRequest) {
  const sudo = haproxySudoPrefix(request);
  const hasUdpRoute = request.routes.some((route) => route.protocol === "udp");
  const firewallCommands = buildProxyFirewallOpenCommands(
    request.routes.map((route) => ({
      port: route.externalPort,
      protocol: route.protocol,
      allowedCidrs: route.allowedCidrs
    }))
  );
  const targetHosts = uniqueTargetHosts(request.routes).join(" ");
  const block = renderManagedBlock(request.serverId, request.routes);

  return [
    "set -eu;",
    `CFG=${HAPROXY_DEFAULTS.configPath};`,
    `SERVER_ID=${shellSingleQuote(request.serverId)};`,
    `TARGET_HOSTS=${shellSingleQuote(targetHosts)};`,
    `MANAGED_BLOCK=${shellSingleQuote(block)};`,
    `BEGIN_MARKER="# BEGIN ${HAPROXY_DEFAULTS.managedMarkerPrefix} $SERVER_ID";`,
    `END_MARKER="# END ${HAPROXY_DEFAULTS.managedMarkerPrefix} $SERVER_ID";`,
    `TMP=${HAPROXY_DEFAULTS.applyTempPrefix}-$SERVER_ID.cfg;`,
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    `if ! command -v haproxy >/dev/null 2>&1; then echo '${HAPROXY_SENTINELS.installedFalse}'; exit 20; fi;`,
    "HAPROXY_VERSION_OUTPUT=$(haproxy -vv 2>&1 || true);",
    `echo '${HAPROXY_SENTINELS.installedTrue}';`,
    "printf '%s\\n' \"$HAPROXY_VERSION_OUTPUT\";",
    hasUdpRoute
      ? `if printf '%s\\n' "$HAPROXY_VERSION_OUTPUT" | grep -Eiq 'udp-lb|udp module|enterprise|hapee'; then echo '${HAPROXY_SENTINELS.udpSupportedTrue}'; else echo '${HAPROXY_SENTINELS.udpSupportedFalse}'; exit 21; fi;`
      : `if printf '%s\\n' "$HAPROXY_VERSION_OUTPUT" | grep -Eiq 'udp-lb|udp module|enterprise|hapee'; then echo '${HAPROXY_SENTINELS.udpSupportedTrue}'; else echo '${HAPROXY_SENTINELS.udpSupportedFalse}'; fi;`,
    "$SUDO test -f $CFG;",
    "awk -v begin=\"$BEGIN_MARKER\" -v end=\"$END_MARKER\" -v target_hosts=\"$TARGET_HOSTS\" '",
    "  BEGIN { split(target_hosts, hosts, \" \"); in_block=0; block=\"\"; }",
    "  function matches_target(i) { if (block ~ begin || block ~ end) return 1; for (i in hosts) if (hosts[i] != \"\" && index(block, hosts[i] \":\") > 0) return 1; return 0; }",
    `  /^# BEGIN ${HAPROXY_DEFAULTS.managedMarkerPrefix} / { in_block=1; block=$0 ORS; next }`,
    `  in_block == 1 { block=block $0 ORS; if ($0 ~ /^# END ${HAPROXY_DEFAULTS.managedMarkerPrefix} /) { if (!matches_target()) printf "%s", block; in_block=0; block=""; } next }`,
    "  { print }",
    "  END { if (in_block == 1 && !matches_target()) printf \"%s\", block }",
    "' $CFG > $TMP;",
    "printf '%s\\n' \"$MANAGED_BLOCK\" >> $TMP;",
    "$SUDO haproxy -c -f $TMP;",
    `$SUDO cp $CFG $CFG${HAPROXY_DEFAULTS.backupSuffix};`,
    "$SUDO cp $TMP $CFG;",
    "if command -v systemctl >/dev/null 2>&1; then $SUDO systemctl reload haproxy || $SUDO systemctl restart haproxy; fi;",
    ...firewallCommands,
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;",
    `echo '${HAPROXY_SENTINELS.applied}';`,
    `echo '${HAPROXY_SENTINELS.firewallOpened}';`,
    `echo '${HAPROXY_SENTINELS.reloadedTrue}';`
  ].join(" ");
}

export function haproxyRemoveCommand(request: HaproxyRemoveRequest) {
  const sudo = haproxySudoPrefix(request);
  const targetHosts = (request.targetHosts ?? []).map((host) => host.trim()).filter(Boolean).join(" ");
  const requestedRouteIds = (request.routeIds ?? []).map((routeId) => sanitizeShellIdentifier(routeId.trim())).filter(Boolean);
  const routeIds = requestedRouteIds.join(" ");
  const routeFilterEnabled = requestedRouteIds.length > 0 ? "true" : "false";
  const firewallCommands = buildProxyFirewallCloseCommands(request.closePorts);

  return [
    "set -u;",
    `CFG=${HAPROXY_DEFAULTS.configPath};`,
    `SERVER_ID=${shellSingleQuote(request.serverId)};`,
    `TARGET_HOSTS=${shellSingleQuote(targetHosts)};`,
    `ROUTE_IDS=${shellSingleQuote(routeIds)};`,
    `ROUTE_FILTER_ENABLED=${shellSingleQuote(routeFilterEnabled)};`,
    `BEGIN_MARKER="# BEGIN ${HAPROXY_DEFAULTS.managedMarkerPrefix} $SERVER_ID";`,
    `END_MARKER="# END ${HAPROXY_DEFAULTS.managedMarkerPrefix} $SERVER_ID";`,
    `TMP=${HAPROXY_DEFAULTS.removeTempPrefix}-$SERVER_ID.cfg;`,
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    `if ! command -v haproxy >/dev/null 2>&1; then echo '${HAPROXY_SENTINELS.removed}'; echo '${HAPROXY_SENTINELS.reloadedFalse}'; exit 0; fi;`,
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
    `  /^# BEGIN ${HAPROXY_DEFAULTS.managedMarkerPrefix} / { in_block=1; block=$0 ORS; next }`,
    `  in_block == 1 { block=block $0 ORS; if ($0 ~ /^# END ${HAPROXY_DEFAULTS.managedMarkerPrefix} /) { if (!matches_target()) printf "%s", block; else if (route_filter == "true") print_filtered_block(); in_block=0; block=""; } next }`,
    "  { print }",
    "  END { if (in_block == 1) { if (!matches_target()) printf \"%s\", block; else if (route_filter == \"true\") print_filtered_block(); } }",
    "' $CFG > $TMP;",
    "$SUDO haproxy -c -f $TMP;",
    `$SUDO cp $CFG $CFG${HAPROXY_DEFAULTS.backupSuffix};`,
    "$SUDO cp $TMP $CFG;",
    "if command -v systemctl >/dev/null 2>&1; then $SUDO systemctl reload haproxy || $SUDO systemctl restart haproxy; fi;",
    ...firewallCommands,
    "if command -v firewall-cmd >/dev/null 2>&1; then $SUDO firewall-cmd --reload >/dev/null 2>&1 || true; fi;",
    `echo '${HAPROXY_SENTINELS.removed}';`,
    `echo '${HAPROXY_SENTINELS.reloadedTrue}';`
  ].join(" ");
}
