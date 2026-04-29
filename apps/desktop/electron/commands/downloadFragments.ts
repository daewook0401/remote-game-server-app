import { commandExists } from "./shellFragments.js";

export interface DownloadToFileOptions {
  downloadUrlVariable: string;
  outputPathVariable: string;
  missingToolSentinel: string;
}

export function buildDownloadToFileCommands(options: DownloadToFileOptions) {
  return [
    `if ${commandExists("curl")}; then $SUDO curl -fsSL "$${options.downloadUrlVariable}" -o $${options.outputPathVariable};`,
    `elif ${commandExists("wget")}; then $SUDO wget -q "$${options.downloadUrlVariable}" -O $${options.outputPathVariable};`,
    `else echo '${options.missingToolSentinel}'; exit 12;`,
    "fi;"
  ];
}
