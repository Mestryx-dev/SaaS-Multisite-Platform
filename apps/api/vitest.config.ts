import { defineConfig } from "vitest/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), "../../.env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
  },
});
