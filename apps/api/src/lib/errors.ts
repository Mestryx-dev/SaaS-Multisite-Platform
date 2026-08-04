import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorBody = {
  code: string;
  message: string;
  requestId?: string;
};

export function apiError(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
) {
  const requestId = c.get("requestId") as string | undefined;
  const body: ApiErrorBody = { code, message };
  if (requestId) body.requestId = requestId;
  return c.json(body, status);
}
