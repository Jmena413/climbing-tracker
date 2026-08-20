import {
  endSessionSchema,
  sessionIdParamsSchema,
} from "@climbing-tracker/validation";
import {
  errorResponse,
  parseInput,
  readJsonBody,
} from "../../../../../lib/api-errors";
import { authenticateRequest } from "../../../../../lib/auth";
import { toSessionDto } from "../../../../../lib/session-response";
import { endSession } from "../../../../../lib/sessions";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await authenticateRequest(request);
    const { sessionId } = parseInput(
      sessionIdParamsSchema,
      await context.params,
    );
    const input = parseInput(endSessionSchema, await readJsonBody(request));
    const session = await endSession(user.id, sessionId, input);
    return Response.json({ session: toSessionDto(session) });
  } catch (error) {
    return errorResponse(error);
  }
}
