import { createServerClient } from "@supabase/ssr";

export const createSupabaseServerClient = (cookieHeader = "") => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Supabase public environment variables are not configured");
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
