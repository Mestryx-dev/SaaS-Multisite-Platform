import { createClient, type RedisClientType } from "redis";
import { log } from "./logger.js";

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

export async function getRedis(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (client?.isOpen) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const c = createClient({ url }) as RedisClientType;
      c.on("error", (err) => log("warn", "redis_error", { error: String(err) }));
      await c.connect();
      client = c;
      return client;
    } catch (error) {
      log("warn", "redis_unavailable", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/** Simple fixed-window rate limit. Falls back to allow-all if Redis down. */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = await getRedis();
  if (!redis) {
    return { allowed: true, remaining: limit };
  }
  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
