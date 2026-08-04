export type AppConfig = {
  port: number;
  nodeEnv: string;
  databaseUrl: string | undefined;
  redisUrl: string | undefined;
  betterAuthSecret: string;
  betterAuthUrl: string;
  trustedOrigins: string[];
  adminOrigin: string;
  webOrigin: string;
  publicAdminHost: string;
  publicApiHost: string;
  publicSitesHostSuffix: string;
  publicPlatformHost: string;
  emailFrom: string;
  resendApiKey: string | undefined;
  smtpHost: string | undefined;
  smtpPort: number | undefined;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  s3Endpoint: string | undefined;
  s3Bucket: string | undefined;
  s3AccessKeyId: string | undefined;
  s3SecretAccessKey: string | undefined;
  s3PublicUrlBase: string | undefined;
  s3Region: string;
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
  appleClientId: string | undefined;
  appleClientSecret: string | undefined;
  /** Isolated demo hosts only — never enable on real merchant prod. */
  demoMode: boolean;
  demoSeedEmail: string | undefined;
  demoSeedPassword: string | undefined;
};

export function loadConfig(): AppConfig {
  const secret =
    process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-min-32-chars-long!!";
  const demoMode =
    process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    betterAuthSecret: secret,
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
    trustedOrigins: (process.env.TRUSTED_ORIGINS ??
      "http://localhost:5174,http://localhost:3002,http://localhost:3001")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    adminOrigin: process.env.ADMIN_ORIGIN ?? "http://localhost:5174",
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
    publicAdminHost: process.env.PUBLIC_ADMIN_HOST ?? "admin.mestryx.dev",
    publicApiHost: process.env.PUBLIC_API_HOST ?? "api.mestryx.dev",
    publicSitesHostSuffix:
      process.env.PUBLIC_SITES_HOST_SUFFIX ?? "sites.mestryx.dev",
    publicPlatformHost: process.env.PUBLIC_PLATFORM_HOST ?? "platform.mestryx.dev",
    emailFrom: process.env.EMAIL_FROM ?? "noreply@mestryx.dev",
    resendApiKey: process.env.RESEND_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Bucket: process.env.S3_BUCKET,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3PublicUrlBase: process.env.S3_PUBLIC_URL_BASE,
    s3Region: process.env.S3_REGION ?? "auto",
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    appleClientId: process.env.APPLE_CLIENT_ID,
    appleClientSecret: process.env.APPLE_CLIENT_SECRET,
    demoMode,
    demoSeedEmail: process.env.SEED_EMAIL ?? process.env.DEMO_SEED_EMAIL,
    demoSeedPassword: process.env.SEED_PASSWORD ?? process.env.DEMO_SEED_PASSWORD,
  };
}
