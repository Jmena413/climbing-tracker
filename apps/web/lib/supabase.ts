import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Supabase public environment variables are not configured");
  return { key, url };
}

export const createSupabaseServerClient = (cookieHeader = "") => {
  const { key, url } = publicConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () =>
        cookieHeader
          ? cookieHeader.split("; ").map((cookie) => {
              const [name, ...value] = cookie.split("=");
              return { name: name ?? "", value: value.join("=") };
            })
          : [],
      setAll: () => undefined,
    },
  });
};

/** Creates a cookie-backed client for a server component or route handler. */
export async function createSupabaseCookieClient() {
  const { key, url } = publicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components cannot always write cookies. Middleware and
          // route handlers perform refresh writes when they are available.
        }
      },
    },
  });
}
