/** Safe post-auth redirect path from `?return=` (open-redirect guarded). */
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export function signInHrefWithReturn(pathname: string, search = ""): string {
  const returnPath = `${pathname}${search}`;
  return `/sign-in?return=${encodeURIComponent(returnPath)}`;
}
