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

export function getDockerStatus(): Promise<DockerStatusResponse> {
  return getJSON<DockerStatusResponse>(`${AGENT_BASE_URL}/docker/status`);
}

export function listManagedContainers(): Promise<ContainerSummaryResponse[]> {
  return getJSON<ContainerSummaryResponse[]>(`${AGENT_BASE_URL}/docker/containers`);
}

export function createMinecraftServer(
  payload: CreateMinecraftServerRequest
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, CreateMinecraftServerRequest>(
    `${AGENT_BASE_URL}/docker/minecraft`,
    payload
  );
}

export function applyContainerAction(
  payload: ContainerActionRequest
): Promise<ContainerSummaryResponse> {
  return postJSON<ContainerSummaryResponse, ContainerActionRequest>(
    `${AGENT_BASE_URL}/docker/containers/action`,
    payload
  );
}

export function getConsoleSnapshot(payload: ConsoleAttachRequest): Promise<ConsoleSnapshotResponse> {
  return postJSON<ConsoleSnapshotResponse, ConsoleAttachRequest>(
    `${AGENT_BASE_URL}/docker/containers/console`,
    payload
  );
}
