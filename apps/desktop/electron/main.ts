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
  const detectedOs = detectOperatingSystem(output);

  return {
    connected: true,
    detectedOs,
    expectedOs: request.expectedOs,
    osMatches: doesOperatingSystemMatch(request.expectedOs, detectedOs),
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
    return "powershell -NoProfile -Command \"$PSVersionTable.OS; [System.Environment]::OSVersion.VersionString\"";
  }

  if (expectedOs === "macos") {
    return "sw_vers -productName; sw_vers -productVersion; uname -a";
  }

  return "cat /etc/os-release 2>/dev/null || uname -a";
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
