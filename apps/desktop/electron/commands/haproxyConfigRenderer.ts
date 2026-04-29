import type { HaproxyPortRoute } from "../types.js";
import { HAPROXY_DEFAULTS } from "../config/remoteDefaults.js";
import { sanitizeShellIdentifier } from "./shellQuote.js";

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

export function renderTcpRouteBlock(serverId: string, route: HaproxyPortRoute) {
  const safeServerId = sanitizeShellIdentifier(serverId);
  const safeRouteId = sanitizeShellIdentifier(route.id);
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

export function renderRouteBlock(serverId: string, route: HaproxyPortRoute) {
  if (route.protocol === "udp") {
    return [
      `# UDP route ${route.id} is intentionally not rendered by the generic template.`,
      "# The installed HAProxy must expose a supported UDP module/template before this route can be applied.",
      ""
    ].join("\n");
  }

  return renderTcpRouteBlock(serverId, route);
}

export function renderManagedBlock(serverId: string, routes: HaproxyPortRoute[]) {
  return [
    `# BEGIN ${HAPROXY_DEFAULTS.managedMarkerPrefix} ${serverId}`,
    ...routes.map((route) => renderRouteBlock(serverId, route)),
    `# END ${HAPROXY_DEFAULTS.managedMarkerPrefix} ${serverId}`,
    ""
  ].join("\n");
}
