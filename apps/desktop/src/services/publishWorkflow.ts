import type { PublishSession } from "../types/publish";

const RELAY_HOST = "relay.example.com";
const MINECRAFT_JAVA_PORT = 25565;

export function createInitialSession(): PublishSession {
  return {
    status: "idle",
    relayHost: RELAY_HOST,
    internalPort: MINECRAFT_JAVA_PORT,
    protocol: "tcp"
  };
}

export function startPublishSession(session: PublishSession): PublishSession {
  if (session.status === "published" || session.status === "allocating") {
    return session;
  }

  return {
    ...session,
    status: "allocating",
    remotePort: undefined,
    errorMessage: undefined
  };
}

export function publishSessionWithPort(session: PublishSession, remotePort: number): PublishSession {
  return {
    ...session,
    status: "published",
    remotePort,
    errorMessage: undefined
  };
}

export function stopPublishSession(session: PublishSession): PublishSession {
  if (session.status === "idle" || session.status === "stopping") {
    return session;
  }

  return {
    ...session,
    status: "stopping",
    errorMessage: undefined
  };
}

export function resetPublishSession(session: PublishSession): PublishSession {
  return {
    ...session,
    status: "idle",
    remotePort: undefined,
    errorMessage: undefined
  };
}

export function failPublishSession(session: PublishSession, errorMessage: string): PublishSession {
  return {
    ...session,
    status: "failed",
    errorMessage
  };
}

export function getPublishAddress(session: PublishSession): string {
  if (session.status !== "published" || session.remotePort === undefined) {
    return "공개 전";
  }

  return `${session.relayHost}:${session.remotePort}`;
}

export function getPublishStatusItems(session: PublishSession): string[] {
  const remotePort = session.remotePort ?? "-";

  return [
    `상태: ${getStatusLabel(session.status)}`,
    `프로토콜: ${session.protocol.toUpperCase()}`,
    `내부 포트: ${session.internalPort}`,
    `Relay 포트: ${remotePort}`,
    `오류: ${session.errorMessage ?? "-"}`
  ];
}

export function getStatusLabel(status: PublishSession["status"]): string {
  switch (status) {
    case "idle":
      return "대기";
    case "allocating":
      return "포트 할당중";
    case "published":
      return "공개됨";
    case "stopping":
      return "중지중";
    case "failed":
      return "실패";
    default:
      return status satisfies never;
  }
}
