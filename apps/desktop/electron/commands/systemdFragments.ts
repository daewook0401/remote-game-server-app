export interface SystemdServiceContentOptions {
  description: string;
  after: string[];
  workingDirectory: string;
  environmentFile: string;
  execStart: string;
  restart?: string;
  restartSec?: number;
  wantedBy?: string;
}

export function buildSystemdServiceContent(options: SystemdServiceContentOptions) {
  return [
    "[Unit]",
    `Description=${options.description}`,
    `After=${options.after.join(" ")}`,
    "",
    "[Service]",
    `WorkingDirectory=${options.workingDirectory}`,
    `EnvironmentFile=${options.environmentFile}`,
    `ExecStart=${options.execStart}`,
    `Restart=${options.restart ?? "always"}`,
    `RestartSec=${options.restartSec ?? 3}`,
    "",
    "[Install]",
    `WantedBy=${options.wantedBy ?? "multi-user.target"}`,
    ""
  ].join("\n");
}

export function systemctlAvailable() {
  return "command -v systemctl >/dev/null 2>&1";
}
