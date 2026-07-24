import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../lib/config.js";

const KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "APPLE_CLIENT_ID",
  "APPLE_CLIENT_SECRET",
] as const;

describe("OAuth env soft-disable (FB-072)", () => {
  const snapshot = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of KEYS) {
      const prev = snapshot.get(key);
      if (prev === undefined) delete process.env[key];
      else process.env[key] = prev;
    }
    snapshot.clear();
  });

  function clearOAuthEnv() {
    for (const key of KEYS) {
      snapshot.set(key, process.env[key]);
      delete process.env[key];
    }
  }

  it("loads without Apple/Google credentials", () => {
    clearOAuthEnv();
    const config = loadConfig();
    expect(config.googleClientId).toBeUndefined();
    expect(config.googleClientSecret).toBeUndefined();
    expect(config.appleClientId).toBeUndefined();
    expect(config.appleClientSecret).toBeUndefined();
  });

  it("reads APPLE_CLIENT_ID and APPLE_CLIENT_SECRET when set", () => {
    clearOAuthEnv();
    process.env.APPLE_CLIENT_ID = "com.example.service";
    process.env.APPLE_CLIENT_SECRET = "jwt.secret.value";
    const config = loadConfig();
    expect(config.appleClientId).toBe("com.example.service");
    expect(config.appleClientSecret).toBe("jwt.secret.value");
  });
});
