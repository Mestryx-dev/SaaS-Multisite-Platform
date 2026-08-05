import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { mediaAsset, product, productMedia } from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const registerUrlSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  url: z.string().url(),
  contentType: z.string().optional(),
  alt: z.string().optional(),
});

const presignSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  contentType: z.string().min(3).default("image/jpeg"),
  filename: z.string().min(1).max(200).optional(),
});

const attachSchema = z.object({
  assetId: z.string().uuid(),
  sortOrder: z.number().int().optional().default(0),
  alt: z.string().optional(),
  setAsCover: z.boolean().optional().default(false),
});

function s3Configured(config: AppConfig): boolean {
  return Boolean(
    config.s3Bucket &&
      config.s3AccessKeyId &&
      config.s3SecretAccessKey &&
      (config.s3Endpoint || config.s3Region),
  );
}

function createS3(config: AppConfig) {
  return new S3Client({
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    forcePathStyle: Boolean(config.s3Endpoint),
    credentials: {
      accessKeyId: config.s3AccessKeyId!,
      secretAccessKey: config.s3SecretAccessKey!,
    },
  });
}

export async function listProductGallery(db: Db, productId: string) {
  const rows = await db
    .select({
      id: productMedia.id,
      sortOrder: productMedia.sortOrder,
      alt: productMedia.alt,
      assetId: mediaAsset.id,
      url: mediaAsset.url,
      contentType: mediaAsset.contentType,
    })
    .from(productMedia)
    .innerJoin(mediaAsset, eq(productMedia.assetId, mediaAsset.id))
    .where(eq(productMedia.productId, productId))
    .orderBy(asc(productMedia.sortOrder));
  return rows;
}

export function mediaRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  /** List org (optional site) media assets for CMS library (FB-086). */
  app.get("/organizations/:orgId/media", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const siteId = c.req.query("siteId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const filters = [eq(mediaAsset.organizationId, orgId)];
    if (siteId) {
      filters.push(
        or(eq(mediaAsset.siteId, siteId), isNull(mediaAsset.siteId))!,
      );
    }
    const assets = await db
      .select()
      .from(mediaAsset)
      .where(and(...filters))
      .orderBy(asc(mediaAsset.createdAt));
    return c.json({ assets });
  });

  /** Register an external URL as an asset (local demo / internal trial / no R2). */
  app.post("/media", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = registerUrlSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const key = `external/${parsed.data.organizationId}/${randomUUID()}`;
    const [created] = await db
      .insert(mediaAsset)
      .values({
        organizationId: parsed.data.organizationId,
        siteId: parsed.data.siteId ?? null,
        key,
        url: parsed.data.url,
        contentType: parsed.data.contentType ?? "image/jpeg",
      })
      .returning();

    return c.json(
      {
        asset: {
          id: created!.id,
          url: created!.url,
          key: created!.key,
          contentType: created!.contentType,
        },
      },
      201,
    );
  });

  /** Presigned PUT for R2/S3 when credentials are configured. */
  app.post("/media/presign", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    if (!s3Configured(config)) {
      return apiError(
        c,
        503,
        "STORAGE_NOT_CONFIGURED",
        "S3/R2 not configured — use POST /v1/media with an external url",
      );
    }
    const parsed = presignSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const ext =
      parsed.data.filename?.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ||
      "jpg";
    const key = `org/${parsed.data.organizationId}/${randomUUID()}.${ext}`;
    const publicBase =
      config.s3PublicUrlBase?.replace(/\/$/, "") ??
      `${config.s3Endpoint?.replace(/\/$/, "")}/${config.s3Bucket}`;
    const publicUrl = `${publicBase}/${key}`;

    const [created] = await db
      .insert(mediaAsset)
      .values({
        organizationId: parsed.data.organizationId,
        siteId: parsed.data.siteId ?? null,
        key,
        url: publicUrl,
        contentType: parsed.data.contentType,
      })
      .returning();

    const client = createS3(config);
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: config.s3Bucket!,
        Key: key,
        ContentType: parsed.data.contentType,
      }),
      { expiresIn: 60 * 15 },
    );

    return c.json(
      {
        asset: {
          id: created!.id,
          url: created!.url,
          key: created!.key,
          contentType: created!.contentType,
        },
        uploadUrl,
      },
      201,
    );
  });

  app.get("/products/:productId/media", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, c.req.param("productId")))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const gallery = await listProductGallery(db, prod.id);
    return c.json({ media: gallery, coverUrl: prod.imageUrl });
  });

  app.post("/products/:productId/media", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, c.req.param("productId")))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = attachSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [asset] = await db
      .select()
      .from(mediaAsset)
      .where(
        and(
          eq(mediaAsset.id, parsed.data.assetId),
          eq(mediaAsset.organizationId, prod.organizationId),
        ),
      )
      .limit(1);
    if (!asset) return apiError(c, 404, "NOT_FOUND", "Asset not found");

    const [link] = await db
      .insert(productMedia)
      .values({
        productId: prod.id,
        assetId: asset.id,
        sortOrder: parsed.data.sortOrder,
        alt: parsed.data.alt ?? null,
      })
      .returning();

    if (parsed.data.setAsCover || !prod.imageUrl) {
      await db
        .update(product)
        .set({ imageUrl: asset.url, updatedAt: new Date() })
        .where(eq(product.id, prod.id));
    }

    return c.json(
      {
        media: {
          id: link!.id,
          assetId: asset.id,
          url: asset.url,
          sortOrder: link!.sortOrder,
          alt: link!.alt,
        },
      },
      201,
    );
  });

  app.delete("/products/:productId/media/:mediaId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, c.req.param("productId")))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    await db
      .delete(productMedia)
      .where(
        and(
          eq(productMedia.id, c.req.param("mediaId")),
          eq(productMedia.productId, prod.id),
        ),
      );
    return c.json({ ok: true });
  });

  return app;
}
