import type { ReactNode } from "react";
import { ButtonLink } from "@mestryx/ui";
import { t, type Locale } from "./i18n/index.js";

export type CmsBlock = {
  id: string;
  type: "hero" | "richtext" | "image" | "cta";
  title?: string;
  text?: string;
  url?: string;
  alt?: string;
  href?: string;
  label?: string;
};

export function normalizeBlocks(
  bodyJson: Record<string, unknown> | null | undefined,
): CmsBlock[] {
  if (!bodyJson) return [];
  if (
    bodyJson.version === 1 &&
    Array.isArray(bodyJson.blocks) &&
    bodyJson.blocks.length > 0
  ) {
    return bodyJson.blocks as CmsBlock[];
  }
  if (typeof bodyJson.markdown === "string" && bodyJson.markdown.trim()) {
    return [
      { id: "legacy-markdown", type: "richtext", text: bodyJson.markdown },
    ];
  }
  return [];
}

export function BlockRenderer({
  blocks,
  locale = "en",
}: {
  blocks: CmsBlock[];
  locale?: Locale;
}) {
  if (blocks.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">
        {t(locale, "store.cms.emptyPage")}
      </p>
    );
  }
  return (
    <div className="space-y-10">
      {blocks.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}

function Block({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <section className="space-y-3">
          {block.title ? (
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">
              {block.title}
            </h2>
          ) : null}
          {block.text ? (
            <p className="max-w-2xl text-base text-[var(--muted-foreground)] whitespace-pre-wrap">
              {block.text}
            </p>
          ) : null}
        </section>
      );
    case "richtext":
      return (
        <div className="whitespace-pre-wrap text-base leading-relaxed">
          {block.text}
        </div>
      );
    case "image":
      return block.url ? (
        <figure>
          <img
            src={block.url}
            alt={block.alt ?? ""}
            className="max-h-[28rem] w-full object-cover"
          />
          {block.alt ? (
            <figcaption className="mt-2 text-sm text-[var(--muted-foreground)]">
              {block.alt}
            </figcaption>
          ) : null}
        </figure>
      ) : null;
    case "cta":
      return (
        <section className="space-y-3 rounded border border-[var(--border)] p-6">
          {block.title ? (
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              {block.title}
            </h3>
          ) : null}
          {block.text ? (
            <p className="text-[var(--muted-foreground)] whitespace-pre-wrap">
              {block.text}
            </p>
          ) : null}
          {block.href && block.label ? (
            <ButtonLink href={block.href}>{block.label}</ButtonLink>
          ) : null}
        </section>
      );
    default: {
      const _exhaustive: never = block.type;
      void _exhaustive;
      return null as ReactNode;
    }
  }
}
