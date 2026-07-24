import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp, seedPlans } from "./app.js";
import { createDb } from "./db/client.js";
import { loadConfig } from "./lib/config.js";
import { createAuth } from "./modules/identity/auth.js";
import { log } from "./lib/logger.js";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
loadDotenv({ path: resolve(repoRoot, ".env") });

const config = loadConfig();
const dbBundle = config.databaseUrl ? createDb(config.databaseUrl) : null;
const auth = dbBundle ? createAuth(dbBundle.db, config) : null;

if (dbBundle) {
  seedPlans(dbBundle.db).catch((err) =>
    log("warn", "seed_plans_failed", {
      error: err instanceof Error ? err.message : String(err),
    }),
  );
}

const app = createApp({
  db: dbBundle?.db ?? null,
  auth,
  config,
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  log("info", "api_listening", {
    port: info.port,
    database: config.databaseUrl ? "configured" : "not_configured",
  });
});
