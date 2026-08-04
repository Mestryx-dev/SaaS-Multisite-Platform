import { config as loadDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolve } from "node:path";
import postgres from "postgres";

loadDotenv({ path: resolve(process.cwd(), "../../.env") });
loadDotenv({ path: resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
await client.end();
console.log("Migrations applied");
