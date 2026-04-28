import type { RelayPortAllocationResponse } from "../types/api";
import { postJSON } from "./httpClient";

const RELAY_API_BASE_URL = "http://127.0.0.1:8080";

export function allocateRelayPort(): Promise<RelayPortAllocationResponse> {
  return postJSON<RelayPortAllocationResponse, Record<string, never>>(
    `${RELAY_API_BASE_URL}/ports/allocate`,
    {}
  );
}

export function releaseRelayPort(port: number): Promise<void> {
  return postJSON<void, RelayPortAllocationResponse>(`${RELAY_API_BASE_URL}/ports/release`, { port });
}

