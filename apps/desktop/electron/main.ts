import { app, BrowserWindow, ipcMain } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "ssh2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serversFileName = "servers.json";

type ServerOsType = "linux-ubuntu" | "linux-fedora" | "linux-arch" | "linux" | "windows" | "macos";

interface SshTestRequest {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
  password?: string;
  keyPath?: string;
  expectedOs: ServerOsType;
}

function serversFilePath() {
  return path.join(app.getPath("userData"), serversFileName);
}

ipcMain.handle("servers:load", async () => {
  try {
    return JSON.parse(await readFile(serversFilePath(), "utf8")) as unknown;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
});

ipcMain.handle("servers:save", async (_event, servers: unknown) => {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(serversFilePath(), `${JSON.stringify(servers, null, 2)}\n`, "utf8");
  return true;
});

ipcMain.handle("ssh:test", async (_event, request: SshTestRequest) => {
  const output = await runSshCommand(request);
  const osOutput = extractSection(output, "OS");
  const detectedOs = detectOperatingSystem(osOutput);

  return {
    connected: true,
    detectedOs,
    expectedOs: request.expectedOs,
    osMatches: doesOperatingSystemMatch(request.expectedOs, detectedOs),
    dockerInstalled: isDockerInstalled(output),
    dockerReady: isDockerReady(output),
    agentPortOpen: isAgentPortOpen(output),
    output
  };
});

async function runSshCommand(request: SshTestRequest) {
  const client = new Client();
  const privateKey = request.authMethod === "key" && request.keyPath
    ? await readFile(request.keyPath, "utf8")
    : undefined;

  return new Promise<string>((resolve, reject) => {
    client
      .on("ready", () => {
        client.exec(osDetectionCommand(request.expectedOs), (error, stream) => {
          if (error) {
            client.end();
            reject(error);
            return;
          }

          const chunks: string[] = [];
          const errorChunks: string[] = [];

          stream
            .on("close", () => {
              client.end();
              resolve([...chunks, ...errorChunks].join(""));
            })
            .on("data", (data: Buffer) => {
              chunks.push(data.toString("utf8"));
            });

          stream.stderr.on("data", (data: Buffer) => {
            errorChunks.push(data.toString("utf8"));
          });
        });
      })
      .on("error", reject)
      .connect({
        host: request.host,
        port: request.port,
        username: request.username,
        password: request.authMethod === "password" ? request.password : undefined,
        privateKey,
        readyTimeout: 10000
      });
  });
}

function osDetectionCommand(expectedOs: ServerOsType) {
  if (expectedOs === "windows") {
    return [
      "powershell -NoProfile -Command",
      "\"",
      "Write-Output '__OS_START__';",
      "$PSVersionTable.OS;",
      "[System.Environment]::OSVersion.VersionString;",
      "Write-Output '__OS_END__';",
      "Write-Output '__DOCKER_START__';",
      "if (Get-Command docker -ErrorAction SilentlyContinue) { docker --version; docker info 2>$null; if ($LASTEXITCODE -eq 0) { Write-Output 'DOCKER_READY=true' } else { Write-Output 'DOCKER_READY=false' } } else { Write-Output 'DOCKER_INSTALLED=false'; Write-Output 'DOCKER_READY=false' };",
      "Write-Output '__DOCKER_END__';",
      "Write-Output '__AGENT_START__';",
      "if ((Test-NetConnection 127.0.0.1 -Port 18080 -InformationLevel Quiet)) { Write-Output 'AGENT_PORT_OPEN=true' } else { Write-Output 'AGENT_PORT_OPEN=false' };",
      "Write-Output '__AGENT_END__'",
      "\""
    ].join(" ");
  }

  if (expectedOs === "macos") {
    return [
      "printf '__OS_START__\\n';",
      "sw_vers -productName 2>/dev/null; sw_vers -productVersion 2>/dev/null; uname -a;",
      "printf '\\n__OS_END__\\n';",
      "printf '__DOCKER_START__\\n';",
      "if command -v docker >/dev/null 2>&1; then docker --version; docker info >/dev/null 2>&1 && printf 'DOCKER_READY=true\\n' || printf 'DOCKER_READY=false\\n'; else printf 'DOCKER_INSTALLED=false\\nDOCKER_READY=false\\n'; fi;",
      "printf '__DOCKER_END__\\n';",
      "printf '__AGENT_START__\\n';",
      "if lsof -iTCP:18080 -sTCP:LISTEN >/dev/null 2>&1; then printf 'AGENT_PORT_OPEN=true\\n'; else printf 'AGENT_PORT_OPEN=false\\n'; fi;",
      "printf '__AGENT_END__\\n'"
    ].join(" ");
  }

  return [
    "printf '__OS_START__\\n';",
    "cat /etc/os-release 2>/dev/null || uname -a;",
    "printf '\\n__OS_END__\\n';",
    "printf '__DOCKER_START__\\n';",
    "if command -v docker >/dev/null 2>&1; then docker --version; docker info >/dev/null 2>&1 && printf 'DOCKER_READY=true\\n' || printf 'DOCKER_READY=false\\n'; else printf 'DOCKER_INSTALLED=false\\nDOCKER_READY=false\\n'; fi;",
    "printf '__DOCKER_END__\\n';",
    "printf '__AGENT_START__\\n';",
    "if (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':18080 ') || (command -v netstat >/dev/null 2>&1 && netstat -ltn | grep -q ':18080 ') || (command -v lsof >/dev/null 2>&1 && lsof -iTCP:18080 -sTCP:LISTEN >/dev/null 2>&1); then printf 'AGENT_PORT_OPEN=true\\n'; else printf 'AGENT_PORT_OPEN=false\\n'; fi;",
    "printf '__AGENT_END__\\n'"
  ].join(" ");
}

function detectOperatingSystem(output: string) {
  const normalized = output.toLowerCase();

  if (normalized.includes("ubuntu")) {
    return "linux-ubuntu";
  }

  if (normalized.includes("fedora")) {
    return "linux-fedora";
  }

  if (normalized.includes("arch")) {
    return "linux-arch";
  }

  if (normalized.includes("darwin") || normalized.includes("mac os")) {
    return "macos";
  }

  if (normalized.includes("windows")) {
    return "windows";
  }

  if (normalized.includes("linux")) {
    return "linux";
  }

  return "unknown";
}

function doesOperatingSystemMatch(expectedOs: ServerOsType, detectedOs: string) {
  if (expectedOs === "linux") {
    return detectedOs.startsWith("linux");
  }

  return expectedOs === detectedOs;
}

function extractSection(output: string, section: string) {
  const start = `__${section}_START__`;
  const end = `__${section}_END__`;
  const startIndex = output.indexOf(start);
  const endIndex = output.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return output;
  }

  return output.slice(startIndex + start.length, endIndex).trim();
}

function isDockerInstalled(output: string) {
  const dockerSection = extractSection(output, "DOCKER").toLowerCase();
  return dockerSection.includes("docker version") || dockerSection.includes("docker_installed=true");
}

function isDockerReady(output: string) {
  return extractSection(output, "DOCKER").toLowerCase().includes("docker_ready=true");
}

function isAgentPortOpen(output: string) {
  return extractSection(output, "AGENT").toLowerCase().includes("agent_port_open=true");
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    title: "Remote Game Server",
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
    return;
  }

  void window.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
