import type { SessionDto } from "@climbing-tracker/domain";
import type {
  EndSessionInput,
  StartSessionInput,
} from "@climbing-tracker/validation";

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

interface SessionResponse {
  session: SessionDto;
}

interface ActiveSessionResponse {
  session: SessionDto | null;
}

async function responseError(response: Response): Promise<ApiError> {
  const fallback = "API request failed";
  try {
    const body = (await response.json()) as {
      error?: { message?: unknown };
    };
    return new ApiError(
      response.status,
      typeof body.error?.message === "string" ? body.error.message : fallback,
    );
  } catch {
    return new ApiError(response.status, fallback);
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

  async startSession(input: StartSessionInput = {}): Promise<SessionDto> {
    const token = await getAccessToken();
    const response = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw await responseError(response);
    return ((await response.json()) as SessionResponse).session;
  },

  async getActiveSession(): Promise<SessionDto | null> {
    const token = await getAccessToken();
    const response = await fetch(`${baseUrl}/api/sessions/active`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw await responseError(response);
    return ((await response.json()) as ActiveSessionResponse).session;
  },

  async endSession(
    sessionId: string,
    input: EndSessionInput = {},
  ): Promise<SessionDto> {
    const token = await getAccessToken();
    const response = await fetch(
      `${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
      },
    );
    if (!response.ok) throw await responseError(response);
    return ((await response.json()) as SessionResponse).session;
  },
});
