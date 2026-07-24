import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { log } from "../../lib/logger.js";

type SocialProviders = NonNullable<
  Parameters<typeof betterAuth>[0]["socialProviders"]
>;

export function createAuth(db: Db, config: AppConfig) {
  const socialProviders: SocialProviders = {};

  if (config.googleClientId && config.googleClientSecret) {
    socialProviders.google = {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    };
  }

  if (config.appleClientId && config.appleClientSecret) {
    socialProviders.apple = {
      clientId: config.appleClientId,
      clientSecret: config.appleClientSecret,
      // Apple may omit email after the first consent; keep a stable placeholder.
      mapProfileToUser: (profile) => ({
        email:
          profile.email ?? `${profile.sub}@apple.placeholder.local`,
      }),
    };
  }

  const hasSocial = Object.keys(socialProviders).length > 0;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: config.nodeEnv === "production",
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        log("info", "verification_email", { email: user.email, url });
      },
    },
    ...(hasSocial ? { socialProviders } : {}),
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
