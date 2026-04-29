import type { HaproxySshRequest } from "../types.js";
import { HAPROXY_SENTINELS } from "./sentinels.js";
import { shellSingleQuote } from "./shellQuote.js";

export function haproxySudoPrefix(request: HaproxySshRequest) {
  return request.sudoPassword || (request.authMethod === "password" && request.password) ? "sudo -S" : "sudo -n";
}

export function haproxyStatusCommand() {
  return [
    "set -u;",
    "if command -v haproxy >/dev/null 2>&1; then",
    `  echo '${HAPROXY_SENTINELS.installedTrue}';`,
    "  haproxy -vv 2>&1 || true;",
    "else",
    `  echo '${HAPROXY_SENTINELS.installedFalse}';`,
    "fi;"
  ].join(" ");
}

export function haproxyInstallCommand(request: HaproxySshRequest) {
  const sudo = haproxySudoPrefix(request);

  return [
    "set -eu;",
    `SUDO=${shellSingleQuote(sudo)};`,
    "if [ \"$(id -u)\" -eq 0 ]; then SUDO=; fi;",
    "OS_ID=unknown;",
    "OS_LIKE=;",
    "if [ -r /etc/os-release ]; then . /etc/os-release; OS_ID=${ID:-unknown}; OS_LIKE=${ID_LIKE:-}; fi;",
    `echo "${HAPROXY_SENTINELS.osIdPrefix}$OS_ID";`,
    `echo "${HAPROXY_SENTINELS.osLikePrefix}$OS_LIKE";`,
    `if command -v haproxy >/dev/null 2>&1; then echo '${HAPROXY_SENTINELS.installedTrue}'; haproxy -vv 2>&1 || true; exit 0; fi;`,
    `echo '${HAPROXY_SENTINELS.installAttempted}';`,
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
    `  echo '${HAPROXY_SENTINELS.packageManagerUnsupported}';`,
    "  exit 22;",
    "fi;",
    "if command -v systemctl >/dev/null 2>&1; then",
    "  $SUDO systemctl enable haproxy >/dev/null 2>&1 || true;",
    "  $SUDO systemctl start haproxy >/dev/null 2>&1 || true;",
    "fi;",
    `if command -v haproxy >/dev/null 2>&1; then echo '${HAPROXY_SENTINELS.installedTrue}'; haproxy -vv 2>&1 || true; else echo '${HAPROXY_SENTINELS.installedFalse}'; exit 23; fi;`
  ].join(" ");
}
