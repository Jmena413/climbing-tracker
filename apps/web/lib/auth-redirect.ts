const DEFAULT_NEXT = "/";

/**
 * Accept only same-origin paths. Auth links are user-visible URLs, so a
 * supplied `next` value must never become an open redirect.
 */
export function safeAuthNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT;
  }
  try {
    const parsed = new URL(value, "https://climbing-tracker.invalid");
    if (parsed.origin !== "https://climbing-tracker.invalid") {
      return DEFAULT_NEXT;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || DEFAULT_NEXT;
  } catch {
    return DEFAULT_NEXT;
  }
}

export function authCallbackPath(next: string): string {
  return `/auth/callback?next=${encodeURIComponent(safeAuthNext(next))}`;
}

export function authRedirectUrl(next: string): string {
  const webOrigin =
    process.env.NEXT_PUBLIC_WEB_ORIGIN ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${webOrigin}${authCallbackPath(next)}`;
}
