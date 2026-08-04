export type HostResolutionInput = {
  host: string;
  sitesHostSuffix: string;
};

export type HostResolutionResult =
  | { kind: "platform_subdomain"; slug: string; hostname: string }
  | { kind: "custom_hostname"; hostname: string }
  | { kind: "unknown"; hostname: string };

/** Pure host parser — used by api resolve + apps/web SSR. */
export function resolveHostKind(input: HostResolutionInput): HostResolutionResult {
  const hostname = input.host.toLowerCase().split(":")[0] ?? "";
  const suffix = input.sitesHostSuffix.toLowerCase();

  if (hostname.endsWith(`.${suffix}`)) {
    const slug = hostname.slice(0, -(suffix.length + 1));
    if (slug && !slug.includes(".")) {
      return { kind: "platform_subdomain", slug, hostname };
    }
  }

  if (hostname.includes(".")) {
    return { kind: "custom_hostname", hostname };
  }

  return { kind: "unknown", hostname };
}
