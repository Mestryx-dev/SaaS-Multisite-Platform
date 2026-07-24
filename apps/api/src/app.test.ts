import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("health endpoints", () => {
  it("GET /health returns ok with request id", async () => {
    const app = createApp({ db: null, auth: null });
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("api");
  });

  it("GET /health/ready without db is degraded but 200", async () => {
    const app = createApp({ db: null, auth: null });
    const res = await app.request("/health/ready");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; database: string };
    expect(body.status).toBe("degraded");
    expect(body.database).toBe("not_configured");
  });

  it("GET /openapi.json returns stub", async () => {
    const app = createApp({ db: null, auth: null });
    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string };
    expect(body.openapi).toBe("3.1.0");
  });
});
