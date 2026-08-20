import { errorResponse } from "../../../../lib/api-errors";
import { authenticateRequest } from "../../../../lib/auth";
import { toSessionDto } from "../../../../lib/session-response";
import { getActiveSession } from "../../../../lib/sessions";

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const session = await getActiveSession(user.id);
    return Response.json({ session: session ? toSessionDto(session) : null });
  } catch (error) {
    return errorResponse(error);
  }
}
