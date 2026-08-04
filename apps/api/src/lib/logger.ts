type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[currentLevel()];
}

export function log(
  level: LogLevel,
  message: string,
  fields: Record<string, unknown> = {},
) {
  if (!shouldLog(level)) return;
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    service: "api",
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Sentry stub — no-op until SENTRY_DSN is set and SDK wired. */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN;
  log("error", "exception", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    sentryConfigured: Boolean(dsn),
    ...context,
  });
}
