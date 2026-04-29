import { readFile } from "node:fs/promises";
import { Client } from "ssh2";
import type { SshRequest } from "../types.js";

type ClientOptions = Parameters<Client["connect"]>[0];

async function buildClientOptions(request: SshRequest): Promise<ClientOptions> {
  const privateKey = request.authMethod === "key" && request.keyPath
    ? await readFile(request.keyPath, "utf8")
    : undefined;

  return {
    host: request.host,
    port: request.port,
    username: request.username,
    password: request.authMethod === "password" ? request.password : undefined,
    privateKey,
    tryKeyboard: request.authMethod === "password" && Boolean(request.password),
    readyTimeout: 10000
  };
}

async function buildJumpClientOptions(request: SshRequest): Promise<ClientOptions | undefined> {
  if (request.connectionMode !== "jumpSsh") {
    return undefined;
  }

  if (!request.jumpHost || !request.jumpPort || !request.jumpUsername || !request.jumpAuthMethod) {
    throw new Error("점프 서버 경유 SSH에는 점프 서버 host, port, user, 인증 방식이 필요합니다.");
  }

  const privateKey = request.jumpAuthMethod === "key" && request.jumpKeyPath
    ? await readFile(request.jumpKeyPath, "utf8")
    : undefined;

  return {
    host: request.jumpHost,
    port: request.jumpPort,
    username: request.jumpUsername,
    password: request.jumpAuthMethod === "password" ? request.jumpPassword : undefined,
    privateKey,
    tryKeyboard: request.jumpAuthMethod === "password" && Boolean(request.jumpPassword),
    readyTimeout: 10000
  };
}

function connectClient(options: ClientOptions) {
  const client = new Client();
  const password = typeof options.password === "string" ? options.password : "";

  return new Promise<Client>((resolve, reject) => {
    client
      .on("ready", () => resolve(client))
      .on("keyboard-interactive", (_name, _instructions, _language, prompts, finish) => {
        finish(prompts.map(() => password));
      })
      .on("error", reject)
      .connect(options);
  });
}

async function connectTargetClient(request: SshRequest) {
  const targetOptions = await buildClientOptions(request);
  const jumpOptions = await buildJumpClientOptions(request);

  if (!jumpOptions) {
    return { client: await connectClient(targetOptions), jumpClient: undefined };
  }

  const jumpClient = await connectClient(jumpOptions);
  return new Promise<{ client: Client; jumpClient?: Client }>((resolve, reject) => {
    jumpClient.forwardOut(
      "127.0.0.1",
      0,
      request.host,
      request.port,
      (error, stream) => {
        if (error) {
          jumpClient.end();
          reject(error);
          return;
        }

        const client = new Client();
        client
          .on("ready", () => resolve({ client, jumpClient }))
          .on("error", (clientError) => {
            jumpClient.end();
            reject(clientError);
          })
          .connect({
            ...targetOptions,
            sock: stream
          });
      }
    );
  });
}

export async function runSshCommand(request: SshRequest, command: string) {
  const { client, jumpClient } = await connectTargetClient(request);

  return new Promise<string>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        client.end();
        jumpClient?.end();
        reject(error);
        return;
      }

      const chunks: string[] = [];
      const errorChunks: string[] = [];

      stream
        .on("close", () => {
          client.end();
          jumpClient?.end();
          resolve([...chunks, ...errorChunks].join(""));
        })
        .on("data", (data: Buffer) => {
          chunks.push(data.toString("utf8"));
        });

      stream.stderr.on("data", (data: Buffer) => {
        errorChunks.push(data.toString("utf8"));
      });
    });
  });
}

export async function runSshCommandWithInput(request: SshRequest, command: string, input: string) {
  const { client, jumpClient } = await connectTargetClient(request);

  return new Promise<string>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        client.end();
        jumpClient?.end();
        reject(error);
        return;
      }

      const chunks: string[] = [];
      const errorChunks: string[] = [];

      stream
        .on("close", (code: number) => {
          client.end();
          jumpClient?.end();
          const output = [...chunks, ...errorChunks].join("");
          if (code === 0) {
            resolve(output);
            return;
          }

          reject(new Error(output || `SSH command failed with exit code ${code}`));
        })
        .on("data", (data: Buffer) => {
          chunks.push(data.toString("utf8"));
        });

      stream.stderr.on("data", (data: Buffer) => {
        errorChunks.push(data.toString("utf8"));
      });

      stream.write(input);
      stream.end();
    });
  });
}
