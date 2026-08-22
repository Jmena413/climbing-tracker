export function webAuthUrl(path: "/" | "/auth/update-password"): string {
  const origin =
    process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`;
}
