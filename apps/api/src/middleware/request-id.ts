import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export type RequestIdVariables = {
  requestId: string;
};

export const requestIdMiddleware: MiddlewareHandler<{
  Variables: RequestIdVariables;
}> = async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
};
