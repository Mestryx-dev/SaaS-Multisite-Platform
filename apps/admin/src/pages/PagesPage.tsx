import {
  Alert,
  Button,
  EmptyState,
  FilterBar,
  FormActions,
  FormField,
  FormRow,
  Input,
  Label,
  PageContent,
  PageHeader,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  TableSkeleton,
  Stack,
  TableFrame,
  Textarea,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch, slugify } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string; status: string };
type Page = {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  bodyJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
};

type BlockType = "hero" | "richtext" | "image" | "cta";
type Block = {
  id: string;
  type: BlockType;
  title?: string;
  text?: string;
  url?: string;
  alt?: string;
  href?: string;
  label?: string;
};

function newId() {
  return crypto.randomUUID();
}

function parseBlocks(bodyJson: Record<string, unknown>): Block[] {
  if (
    bodyJson?.version === 1 &&
    Array.isArray(bodyJson.blocks) &&
    bodyJson.blocks.length > 0
  ) {
    return bodyJson.blocks as Block[];
  }
  if (typeof bodyJson?.markdown === "string" && bodyJson.markdown.trim()) {
    return [{ id: newId(), type: "richtext", text: bodyJson.markdown }];
  }
  return [];
}

export function PagesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState<BlockType>("richtext");
  const [formOpen, setFormOpen] = useState(false);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const sites = useQuery({
    queryKey: ["sites", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ sites: Site[] }>(`/v1/organizations/${selectedOrgId}/sites`),
  });

  useEffect(() => {
    setSiteId("");
    setEditingId(null);
    setTitle("");
    setSlug("");
    setStatus("draft");
    setBlocks([]);
    setSeoTitle("");
    setSeoDescription("");
    setError(null);
    setFormOpen(false);
  }, [selectedOrgId]);

  useEffect(() => {
    const lunaSite = sites.data?.sites?.find((s) => s.slug === "luna");
    const first = sites.data?.sites?.[0]?.id ?? "";
    if (!siteId && (lunaSite?.id || first)) {
      setSiteId(lunaSite?.id ?? first);
    }
  }, [sites.data, siteId]);

  const pages = useQuery({
    queryKey: ["pages", siteId],
    enabled: Boolean(siteId),
    queryFn: () => apiFetch<{ pages: Page[] }>(`/v1/sites/${siteId}/pages`),
  });

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setStatus("draft");
    setBlocks([]);
    setSeoTitle("");
    setSeoDescription("");
    setError(null);
    setFormOpen(false);
  }

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setStatus("draft");
    setBlocks([]);
    setSeoTitle("");
    setSeoDescription("");
    setError(null);
    setFormOpen(true);
  }

  function loadPage(p: Page) {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setStatus(p.status);
    setBlocks(parseBlocks(p.bodyJson ?? {}));
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setError(null);
    setFormOpen(true);
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[idx]!;
      copy[idx] = copy[next]!;
      copy[next] = tmp;
      return copy;
    });
  }

  const savePage = useMutation({
    mutationFn: async () => {
      const bodyJson = { version: 1 as const, blocks };
      if (editingId) {
        return apiFetch<{ page: Page }>(`/v1/pages/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title,
            slug: slug || slugify(title),
            status,
            bodyJson,
            seoTitle: seoTitle || undefined,
            seoDescription: seoDescription || undefined,
          }),
        });
      }
      return apiFetch<{ page: Page }>("/v1/pages", {
        method: "POST",
        body: JSON.stringify({
          siteId,
          title,
          slug: slug || slugify(title),
          status,
          bodyJson,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
        }),
      });
    },
    onSuccess: async () => {
      resetForm();
      await qc.invalidateQueries({ queryKey: ["pages", siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deletePage = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/v1/pages/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      if (editingId) resetForm();
      await qc.invalidateQueries({ queryKey: ["pages", siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = pages.data?.pages ?? [];

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          title={t("nav.pages")}
          description="CMS pages and preview."
          actions={
            siteId ? (
              <Button type="button" size="sm" onClick={openCreate}>
                {t("page.create")}
              </Button>
            ) : null
          }
        />

        <FilterBar>
          <div className="min-w-[12rem]">
            <Label htmlFor="page-site">{t("product.site")}</Label>
            <Select
              id="page-site"
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                resetForm();
              }}
            >
              {(sites.data?.sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <div>
          <h2 className="mb-2 text-sm font-semibold">{t("page.list")}</h2>
          {pages.isLoading ? (
            <TableFrame>
              <TableSkeleton />
            </TableFrame>
          ) : rows.length === 0 ? (
            <EmptyState
              title={t("page.empty")}
              description="Create a CMS page for the selected site."
              action={
                <Button type="button" size="sm" onClick={openCreate}>
                  {t("page.create")}
                </Button>
              }
            />
          ) : (
            <TableFrame>
              <ul className="divide-y divide-[var(--border)]">
                {rows.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span>
                      <strong>{p.title}</strong>{" "}
                      <code className="text-xs text-[var(--muted-foreground)]">
                        {p.slug}
                      </code>{" "}
                      <span className="text-[var(--muted-foreground)]">
                        {p.status}
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => loadPage(p)}
                      >
                        {t("page.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void (async () => {
                            try {
                              const data = await apiFetch<{
                                path: string;
                                siteSlug: string;
                              }>(`/v1/pages/${p.id}/preview-token`, {
                                method: "POST",
                              });
                              const webOrigin =
                                import.meta.env.VITE_WEB_ORIGIN ??
                                "http://localhost:3002";
                              const sitesSuffix =
                                import.meta.env.VITE_PUBLIC_SITES_HOST_SUFFIX ??
                                "";
                              const url =
                                sitesSuffix && data.siteSlug
                                  ? `https://${data.siteSlug}.${sitesSuffix}${data.path}`
                                  : `${webOrigin.replace(/\/$/, "")}${data.path}`;
                              window.open(url, "_blank", "noopener,noreferrer");
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Preview failed",
                              );
                            }
                          })();
                        }}
                      >
                        {t("page.preview")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePage.mutate(p.id)}
                      >
                        {t("page.delete")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </TableFrame>
          )}
        </div>

        <Sheet
          open={formOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            else setFormOpen(true);
          }}
        >
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-xl"
          >
            <SheetHeader>
              <SheetTitle>
                {editingId ? t("page.update") : t("page.create")}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pb-6">
          <FormField label={t("page.title")} htmlFor="page-title" size="md">
            <Input
              id="page-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editingId) setSlug(slugify(e.target.value));
              }}
            />
          </FormField>
          <FormRow cols={2}>
            <FormField label={t("page.slug")} htmlFor="page-slug" size="full">
              <Input
                id="page-slug"
                className="font-mono text-xs"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </FormField>
            <FormField label={t("page.status")} htmlFor="page-status" size="full">
              <Select
                id="page-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </Select>
            </FormField>
          </FormRow>

          <h3 className="text-sm font-semibold">{t("page.blocks")}</h3>
          {blocks.map((b, i) => (
            <div
              key={b.id}
              className="rounded-[var(--radius)] border border-[var(--border)] p-4"
            >
              <Stack gap="sm">
                <strong>
                  #{i + 1} {b.type}
                </strong>
                {(b.type === "hero" || b.type === "cta") && (
                  <FormField
                    label={t("page.blockTitle")}
                    htmlFor={`block-title-${b.id}`}
                    size="md"
                  >
                    <Input
                      id={`block-title-${b.id}`}
                      value={b.title ?? ""}
                      onChange={(e) =>
                        updateBlock(b.id, { title: e.target.value })
                      }
                    />
                  </FormField>
                )}
                {(b.type === "hero" ||
                  b.type === "richtext" ||
                  b.type === "cta") && (
                  <FormField
                    label={t("page.blockText")}
                    htmlFor={`block-text-${b.id}`}
                    size="full"
                  >
                    <Textarea
                      id={`block-text-${b.id}`}
                      rows={4}
                      value={b.text ?? ""}
                      onChange={(e) =>
                        updateBlock(b.id, { text: e.target.value })
                      }
                    />
                  </FormField>
                )}
                {b.type === "image" && (
                  <>
                    <FormField
                      label={t("page.blockImageUrl")}
                      htmlFor={`block-url-${b.id}`}
                      size="lg"
                    >
                      <Input
                        id={`block-url-${b.id}`}
                        value={b.url ?? ""}
                        onChange={(e) =>
                          updateBlock(b.id, { url: e.target.value })
                        }
                        placeholder="https://"
                      />
                    </FormField>
                    <FormField
                      label={t("page.blockAlt")}
                      htmlFor={`block-alt-${b.id}`}
                      size="md"
                    >
                      <Input
                        id={`block-alt-${b.id}`}
                        value={b.alt ?? ""}
                        onChange={(e) =>
                          updateBlock(b.id, { alt: e.target.value })
                        }
                      />
                    </FormField>
                  </>
                )}
                {b.type === "cta" && (
                  <>
                    <FormField
                      label={t("page.blockCtaLabel")}
                      htmlFor={`block-label-${b.id}`}
                      size="md"
                    >
                      <Input
                        id={`block-label-${b.id}`}
                        value={b.label ?? ""}
                        onChange={(e) =>
                          updateBlock(b.id, { label: e.target.value })
                        }
                      />
                    </FormField>
                    <FormField
                      label={t("page.blockHref")}
                      htmlFor={`block-href-${b.id}`}
                      size="md"
                    >
                      <Input
                        id={`block-href-${b.id}`}
                        value={b.href ?? ""}
                        onChange={(e) =>
                          updateBlock(b.id, { href: e.target.value })
                        }
                      />
                    </FormField>
                  </>
                )}
                <FormActions>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(b.id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(b.id, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBlocks((prev) => prev.filter((x) => x.id !== b.id))
                    }
                  >
                    {t("page.removeBlock")}
                  </Button>
                </FormActions>
              </Stack>
            </div>
          ))}

          <FormField label={t("page.addBlock")} htmlFor="add-block-type" size="md">
            <Select
              id="add-block-type"
              value={addType}
              onChange={(e) => setAddType(e.target.value as BlockType)}
            >
              <option value="hero">hero</option>
              <option value="richtext">richtext</option>
              <option value="image">image</option>
              <option value="cta">cta</option>
            </Select>
          </FormField>
          <FormActions>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setBlocks((prev) => [
                  ...prev,
                  { id: newId(), type: addType, text: "", title: "", url: "" },
                ])
              }
            >
              {t("page.addBlock")}
            </Button>
          </FormActions>

          <FormField label={t("page.seoTitle")} htmlFor="page-seo-title" size="md">
            <Input
              id="page-seo-title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </FormField>
          <FormField
            label={t("page.seoDescription")}
            htmlFor="page-seo-desc"
            size="md"
          >
            <Input
              id="page-seo-desc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </FormField>
          {error ? <Alert>{error}</Alert> : null}
          <FormActions>
            <Button
              type="button"
              size="sm"
              onClick={() => savePage.mutate()}
              disabled={!title || !siteId || savePage.isPending}
            >
              {editingId ? t("page.update") : t("page.create")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              {t("page.cancel")}
            </Button>
          </FormActions>
            </div>
          </SheetContent>
        </Sheet>
      </Stack>
    </PageContent>
  );
}
