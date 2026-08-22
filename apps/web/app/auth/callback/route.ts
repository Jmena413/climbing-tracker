import { NextResponse } from "next/server";
import { safeAuthNext } from "../../../lib/auth-redirect";
import { createSupabaseCookieClient } from "../../../lib/supabase";

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const next = safeAuthNext(params.get("next"));
  const errorPath =
    "/auth/error?message=This%20authentication%20link%20is%20invalid%2C%20expired%2C%20or%20already%20used.";

  if (params.get("error") || params.get("error_code")) {
    return redirect(request, errorPath);
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return redirect(request, errorPath);
    } else if (tokenHash) {
      const type = params.get("type");
      const confirmationType =
        type === "email" ||
        type === "signup" ||
        type === "invite" ||
        type === "magiclink" ||
        type === "email_change"
          ? type
          : null;
      const otpType = type === "recovery" ? "recovery" : confirmationType;
      if (!otpType) {
        return redirect(request, errorPath);
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });
      if (error) return redirect(request, errorPath);
      // Recovery links need to land on the password form. Confirmation links
      // can continue to the requested safe internal destination.
      return redirect(
        request,
        type === "recovery" ? "/auth/update-password" : next,
      );
    } else {
      return redirect(request, errorPath);
    }
    return redirect(request, next);
  } catch {
    return redirect(request, errorPath);
  }
}
