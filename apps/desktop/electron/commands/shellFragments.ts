export type ShellProtocol = "tcp" | "udp";

export function commandExists(command: string) {
  return `command -v ${command} >/dev/null 2>&1`;
}

export function portProtocol(port: number, protocol: ShellProtocol) {
  return `${port}/${protocol}`;
}

export function validatePort(port: number) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
