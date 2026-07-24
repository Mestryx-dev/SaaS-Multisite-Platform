import { createHmac, timingSafeEqual } from "node:crypto";

export type PreviewPayload = {
  pageId: string;
  siteId: string;
  slug: string;
  exp: number;
};

const TTL_SEC = 30 * 60;

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64url");
}

export function signPreviewToken(
  secret: string,
  payload: { pageId: string; siteId: string; slug: string },
  ttlSec = TTL_SEC,
): string {
  const body: PreviewPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const encoded = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyPreviewToken(
  secret: string,
  token: string,
): PreviewPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as PreviewPayload;
    if (
      !payload.pageId ||
      !payload.siteId ||
      !payload.slug ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
