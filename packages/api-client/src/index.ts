export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  fetch?: typeof globalThis.fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const createApiClient = ({
  baseUrl,
  getAccessToken,
  fetch = globalThis.fetch,
}: ApiClientOptions) => ({
  async health(): Promise<{ status: string }> {
    const token = await getAccessToken();
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new ApiError(response.status, "API request failed");
    return response.json() as Promise<{ status: string }>;
  },
});
