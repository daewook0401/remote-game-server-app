import type {
  ConsoleAttachRequest,
  ConsoleSnapshotResponse,
  ContainerActionRequest,
  ContainerSummaryResponse,
  CreateMinecraftServerRequest,
  DockerStatusResponse
} from "../types/api";
import { getJSON, postJSON } from "./httpClient";

const AGENT_BASE_URL = "http://127.0.0.1:18080";

function agentUrl(path: string, baseUrl = AGENT_BASE_URL) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export function getDockerStatus(baseUrl?: string, token?: string): Promise<DockerStatusResponse> {
  return getJSON<DockerStatusResponse>(agentUrl("/docker/status", baseUrl), { token });
}

export function listManagedContainers(baseUrl?: string, token?: string): Promise<ContainerSummaryResponse[]> {
  return getJSON<ContainerSummaryResponse[]>(agentUrl("/docker/containers", baseUrl), { token });
}

export function createMinecraftServer(
  payload: CreateMinecraftServerRequest,
  baseUrl?: string,
  token?: string
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, CreateMinecraftServerRequest>(
    agentUrl("/docker/minecraft", baseUrl),
    payload,
    { token }
  );
}

export function applyContainerAction(
  payload: ContainerActionRequest,
  baseUrl?: string,
  token?: string
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, ContainerActionRequest>(
    agentUrl("/docker/containers/action", baseUrl),
    payload,
    { token }
  );
}

export function getConsoleSnapshot(
  payload: ConsoleAttachRequest,
  baseUrl?: string,
  token?: string
): Promise<ConsoleSnapshotResponse> {
  return postJSON<ConsoleSnapshotResponse, ConsoleAttachRequest>(
    agentUrl("/docker/containers/console", baseUrl),
    payload,
    { token }
  );
}
