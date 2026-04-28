import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const serversFileName = "servers.json";

function serversFilePath() {
  return path.join(app.getPath("userData"), serversFileName);
}

export async function loadServers() {
  try {
    return JSON.parse(await readFile(serversFilePath(), "utf8")) as unknown;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function saveServers(servers: unknown) {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(serversFilePath(), `${JSON.stringify(servers, null, 2)}\n`, "utf8");
  return true;
}
