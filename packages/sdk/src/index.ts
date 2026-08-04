/** Hand-written client until OpenAPI orval generation is wired. */

export type ApiError = { code: string; message: string; requestId?: string };

export function createApiClient(baseUrl: string, getCookie?: () => string) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }
    const cookie = getCookie?.();
    if (cookie) headers.set("cookie", cookie);

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
    const data = (await res.json()) as T | ApiError;
    if (!res.ok) {
      throw Object.assign(new Error((data as ApiError).message ?? res.statusText), {
        status: res.status,
        body: data,
      });
    }
    return data as T;
  }

  return {
    health: () => request<{ status: string }>("/health"),
    listOrganizations: () =>
      request<{ organizations: Array<Record<string, unknown>> }>("/v1/organizations"),
    createOrganization: (body: { name: string; slug: string }) =>
      request<{ organization: Record<string, unknown> }>("/v1/organizations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createSite: (body: {
      organizationId: string;
      name: string;
      slug: string;
      defaultLocale?: string;
    }) =>
      request<{ site: Record<string, unknown> }>("/v1/sites", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    listSites: (organizationId: string) =>
      request<{ sites: Array<Record<string, unknown>> }>(
        `/v1/organizations/${organizationId}/sites`,
      ),
    resolveHost: (host: string) =>
      request<{ site: Record<string, unknown>; source: string }>(
        `/v1/public/resolve-host?host=${encodeURIComponent(host)}`,
      ),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
