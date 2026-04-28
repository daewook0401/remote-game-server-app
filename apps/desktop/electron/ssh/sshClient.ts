import { readFile } from "node:fs/promises";
import { Client } from "ssh2";
import type { SshRequest } from "../types.js";

export async function runSshCommand(request: SshRequest, command: string) {
  const client = new Client();
  const privateKey = request.authMethod === "key" && request.keyPath
    ? await readFile(request.keyPath, "utf8")
    : undefined;

  return new Promise<string>((resolve, reject) => {
    client
      .on("ready", () => {
        client.exec(command, (error, stream) => {
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
