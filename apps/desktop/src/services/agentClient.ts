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

export function getDockerStatus(baseUrl?: string): Promise<DockerStatusResponse> {
  return getJSON<DockerStatusResponse>(agentUrl("/docker/status", baseUrl));
}

export function listManagedContainers(baseUrl?: string): Promise<ContainerSummaryResponse[]> {
  return getJSON<ContainerSummaryResponse[]>(agentUrl("/docker/containers", baseUrl));
}

export function createMinecraftServer(
  payload: CreateMinecraftServerRequest,
  baseUrl?: string
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, CreateMinecraftServerRequest>(
    agentUrl("/docker/minecraft", baseUrl),
    payload
  );
}

export function applyContainerAction(
  payload: ContainerActionRequest,
  baseUrl?: string
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, ContainerActionRequest>(
    agentUrl("/docker/containers/action", baseUrl),
    payload
  );
}

export function getConsoleSnapshot(
  payload: ConsoleAttachRequest,
  baseUrl?: string
): Promise<ConsoleSnapshotResponse> {
  return postJSON<ConsoleSnapshotResponse, ConsoleAttachRequest>(
    agentUrl("/docker/containers/console", baseUrl),
    payload
  );
}
