/**
 * CMS page bodyJson contract (FB-075).
 *
 * Preferred:
 *   { "version": 1, "blocks": [ { "id", "type", ... } ] }
 * Legacy:
 *   { "markdown": "..." }
 */

export type CmsBlockType = "hero" | "richtext" | "image" | "cta";

export type CmsBlock = {
  id: string;
  type: CmsBlockType;
  title?: string;
  text?: string;
  url?: string;
  alt?: string;
  href?: string;
  label?: string;
  mediaAssetId?: string;
};

export type CmsBodyV1 = {
  version: 1;
  blocks: CmsBlock[];
};

const BLOCK_TYPES = new Set<string>(["hero", "richtext", "image", "cta"]);

export function isCmsBodyV1(value: unknown): value is CmsBodyV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || !Array.isArray(v.blocks)) return false;
  return v.blocks.every((b) => {
    if (!b || typeof b !== "object") return false;
    const block = b as Record<string, unknown>;
    return typeof block.id === "string" && BLOCK_TYPES.has(String(block.type));
  });
}

/** Normalize any bodyJson into renderable blocks (legacy markdown → one richtext). */
export function normalizeBlocks(
  bodyJson: Record<string, unknown> | null | undefined,
): CmsBlock[] {
  if (!bodyJson) return [];
  if (isCmsBodyV1(bodyJson)) return bodyJson.blocks;
  if (typeof bodyJson.markdown === "string" && bodyJson.markdown.trim()) {
    return [
      {
        id: "legacy-markdown",
        type: "richtext",
        text: bodyJson.markdown,
      },
    ];
  }
  return [];
}

export function buildBodyFromBlocks(blocks: CmsBlock[]): CmsBodyV1 {
  return { version: 1, blocks };
}
