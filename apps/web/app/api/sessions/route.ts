import { startSessionSchema } from "@climbing-tracker/validation";
import {
  errorResponse,
  parseInput,
  readJsonBody,
} from "../../../lib/api-errors";
import { authenticateRequest } from "../../../lib/auth";
import { toSessionDto } from "../../../lib/session-response";
import { startSession } from "../../../lib/sessions";

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const input = parseInput(startSessionSchema, await readJsonBody(request));
    const session = await startSession(user.id, input);
    return Response.json({ session: toSessionDto(session) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
