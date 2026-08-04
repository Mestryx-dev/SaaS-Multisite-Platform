import { toast } from "@mestryx/ui";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiClientError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = (await res.json()) as T & { message?: string; code?: string };
  if (!res.ok) {
    const code = data.code;
    const message = data.message ?? `Request failed (${res.status})`;
    if (code === "DEMO_READ_ONLY") {
      toast.error(message);
    }
    throw new ApiClientError(message, res.status, code);
  }
  return data;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}
