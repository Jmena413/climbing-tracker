import { ZodError, type ZodType } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (!body.trim()) return {};

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new RequestValidationError(result.error);
  }
  return result.data;
}

class RequestValidationError extends HttpError {
  constructor(public readonly validationError: ZodError) {
    super(400, "VALIDATION_ERROR", "Request validation failed");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestValidationError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          issues: error.validationError.issues,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof HttpError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 },
  );
}
