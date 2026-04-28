interface RequestOptions {
  token?: string;
}

function authHeaders(options?: RequestOptions) {
  if (!options?.token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${options.token}`
  };
}

export async function getJSON<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
  const response = await fetch(url, {
    headers: authHeaders(options)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function postJSON<TResponse, TPayload>(
  url: string,
  payload: TPayload,
  options?: RequestOptions
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
