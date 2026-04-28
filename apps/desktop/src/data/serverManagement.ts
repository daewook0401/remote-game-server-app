import type { GameTemplate, ManagedServer } from "../types/server";

export const managedServers: ManagedServer[] = [
  {
    id: "local",
    name: "내 로컬 서버",
    targetType: "local",
    host: "localhost",
    status: "connected",
    agentStatus: "connected",
    dockerStatus: "ready"
  },
  {
    id: "aws-demo",
    name: "Amazon Minecraft 서버",
    targetType: "cloud",
    host: "ec2-user@203.0.113.10:22",
    status: "setupRequired",
    agentStatus: "notInstalled",
    dockerStatus: "unknown"
  }
];

export const gameTemplates: GameTemplate[] = [
  {
    id: "minecraft-java",
    name: "Minecraft Java",
    image: "itzg/minecraft-server",
    defaultPort: 25565,
    protocol: "tcp"
  }
];

export const consoleLines = [
  "[10:01:13] Starting minecraft server version 1.21.1",
  "[10:01:18] Preparing level \"world\"",
  "[10:01:25] Done (7.213s)! For help, type \"help\"",
  "> "
];
