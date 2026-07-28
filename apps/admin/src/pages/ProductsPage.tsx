import {
  Alert,
  Badge,
  BulkActionBar,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FilterBar,
  FormActions,
  FormField,
  FormRow,
  Input,
  Label,
  ListPanel,
  Muted,
  PageContent,
  PageHeader,
  SearchField,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  TableSkeleton,
  Stack,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  toast,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch, slugify } from "../lib/api";
import { downloadCsv, rowsToCsv } from "../lib/csv-export";
import { productStatusLabel } from "../lib/status-labels";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string; status: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  stock: number;
  status: string;
  currency: string;
  siteId: string | null;
  organizationId: string;
  imageUrl?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  siteId: string | null;
  parentId: string | null;
};

type Variant = {
  id: string;
  sku: string;
  optionsJson: Record<string, string>;
  priceCents: number;
  stock: number;
  status: string;
};

function formatMoney(cents: number, currency: string, language: string) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function ProductsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [publishSiteId, setPublishSiteId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("29.90");
  const [stock, setStock] = useState("10");
  const [lowStock, setLowStock] = useState("5");
  const [status, setStatus] = useState<"draft" | "active">("active");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [variantSku, setVariantSku] = useState("");
  const [variantOptions, setVariantOptions] = useState('{"size":"M"}');
  const [variantPrice, setVariantPrice] = useState("29.90");
  const [variantStock, setVariantStock] = useState("10");
  const [variantStatus, setVariantStatus] = useState<"active" | "draft">("active");
  const [galleryUrl, setGalleryUrl] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");

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
    setPublishSiteId("");
  }, [selectedOrgId]);

  useEffect(() => {
    const lunaSite = sites.data?.sites?.find((s) => s.slug === "luna");
    const first = sites.data?.sites?.[0]?.id ?? "";
    if (!publishSiteId && (lunaSite?.id || first)) {
      setPublishSiteId(lunaSite?.id ?? first);
    }
  }, [sites.data, publishSiteId]);

  const products = useQuery({
    queryKey: ["org-products", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ products: Product[] }>(
        `/v1/organizations/${selectedOrgId}/products`,
      ),
  });

  const selectedProduct = useMemo(
    () => products.data?.products?.find((p) => p.id === selectedProductId) ?? null,
    [products.data, selectedProductId],
  );

  const orgCategories = useQuery({
    queryKey: ["categories", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ categories: Category[] }>(
        `/v1/organizations/${selectedOrgId}/categories`,
      ),
  });

  const productCategories = useQuery({
    queryKey: ["product-categories", selectedProductId],
    enabled: Boolean(selectedProductId),
    queryFn: () =>
      apiFetch<{ categories: Category[] }>(
        `/v1/products/${selectedProductId}/categories`,
      ),
  });

  useEffect(() => {
    const ids = (productCategories.data?.categories ?? []).map((c) => c.id);
    setSelectedCategoryIds(ids);
  }, [productCategories.data, selectedProductId]);

  const variants = useQuery({
    queryKey: ["product-variants", selectedProductId],
    enabled: Boolean(selectedProductId),
    queryFn: () =>
      apiFetch<{ variants: Variant[] }>(
        `/v1/products/${selectedProductId}/variants`,
      ),
  });

  const saveProductCategories = useMutation({
    mutationFn: () =>
      apiFetch<{ categories: Category[] }>(
        `/v1/products/${selectedProductId}/categories`,
        {
          method: "PUT",
          body: JSON.stringify({ categoryIds: selectedCategoryIds }),
        },
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["product-categories", selectedProductId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const createVariant = useMutation({
    mutationFn: () => {
      let optionsJson: Record<string, string>;
      try {
        optionsJson = JSON.parse(variantOptions) as Record<string, string>;
      } catch {
        throw new Error("Invalid options JSON");
      }
      const priceCents = Math.round(
        Number.parseFloat(variantPrice.replace(",", ".")) * 100,
      );
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Invalid price");
      }
      return apiFetch<{ variant: Variant }>(
        `/v1/products/${selectedProductId}/variants`,
        {
          method: "POST",
          body: JSON.stringify({
            sku: variantSku,
            optionsJson,
            priceCents,
            stock: Number.parseInt(variantStock, 10) || 0,
            status: variantStatus,
          }),
        },
      );
    },
    onSuccess: async () => {
      setVariantSku("");
      setVariantOptions('{"size":"M"}');
      await qc.invalidateQueries({ queryKey: ["product-variants", selectedProductId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteVariant = useMutation({
    mutationFn: (variantId: string) =>
      apiFetch<{ ok: boolean }>(`/v1/variants/${variantId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["product-variants", selectedProductId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const gallery = useQuery({
    queryKey: ["product-media", selectedProductId],
    enabled: Boolean(selectedProductId),
    queryFn: () =>
      apiFetch<{
        media: Array<{ id: string; url: string; alt: string | null; sortOrder: number }>;
        coverUrl: string | null;
      }>(`/v1/products/${selectedProductId}/media`),
  });

  const addGalleryImage = useMutation({
    mutationFn: async () => {
      const assetRes = await apiFetch<{ asset: { id: string; url: string } }>(
        "/v1/media",
        {
          method: "POST",
          body: JSON.stringify({
            organizationId: selectedOrgId,
            siteId: selectedProduct?.siteId ?? null,
            url: galleryUrl,
          }),
        },
      );
      return apiFetch<{ media: { id: string } }>(
        `/v1/products/${selectedProductId}/media`,
        {
          method: "POST",
          body: JSON.stringify({
            assetId: assetRes.asset.id,
            setAsCover: !(gallery.data?.coverUrl || selectedProduct?.imageUrl),
          }),
        },
      );
    },
    onSuccess: async () => {
      setGalleryUrl("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["product-media", selectedProductId] });
      await qc.invalidateQueries({ queryKey: ["products", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteGalleryImage = useMutation({
    mutationFn: (mediaId: string) =>
      apiFetch<{ ok: boolean }>(
        `/v1/products/${selectedProductId}/media/${mediaId}`,
        { method: "DELETE" },
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["product-media", selectedProductId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  function formatOptions(optionsJson: Record<string, string>) {
    const entries = Object.entries(optionsJson ?? {});
    if (entries.length === 0) return t("product.variantDefault");
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
  }

  const siteName = (id: string | null) => {
    if (!id) return t("product.unpublished");
    return sites.data?.sites?.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  };

  const createProduct = useMutation({
    mutationFn: () => {
      const priceCents = Math.round(Number.parseFloat(price.replace(",", ".")) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Invalid price");
      }
      return apiFetch<{ product: Product }>("/v1/products", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          siteId: publishSiteId || null,
          name,
          slug: slug || slugify(name),
          sku: sku || `SKU-${slugify(name).toUpperCase()}`,
          description: description || undefined,
          priceCents,
          stock: Number.parseInt(stock, 10) || 0,
          lowStockThreshold: Number.parseInt(lowStock, 10) || null,
          status,
        }),
      });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setName("");
      setSlug("");
      setSku("");
      setPrice("29.90");
      setStock("10");
      setLowStock("5");
      setStatus("active");
      setDescription("");
      setError(null);
      toast.success(t("product.created"));
      await qc.invalidateQueries({ queryKey: ["org-products", selectedOrgId] });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (p: Product) =>
      apiFetch<{ product: Product }>(`/v1/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: p.status === "active" ? "draft" : "active",
        }),
      }),
    onSuccess: async () => {
      toast.success(t("product.updated"));
      await qc.invalidateQueries({ queryKey: ["org-products", selectedOrgId] });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const attachSite = useMutation({
    mutationFn: ({ productId, siteId }: { productId: string; siteId: string | null }) =>
      apiFetch<{ product: Product }>(`/v1/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ siteId }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["org-products", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const productRows = useMemo(() => {
    const all = products.data?.products ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [products.data, query]);
  const allSelected =
    productRows.length > 0 &&
    productRows.every((p) => selectedIds.includes(p.id));

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : productRows.map((p) => p.id));
  }

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.products")}
          description={t("product.pageDescription")}
        />

        {!selectedOrgId ? (
          <EmptyState
            title={t("product.noOrgTitle")}
            description={t("product.noOrgHint")}
          />
        ) : (
          <>
            <FilterBar>
              <div className="min-w-[12rem]">
                <Label htmlFor="p-site">{t("product.publishSite")}</Label>
                <Select
                  id="p-site"
                  value={publishSiteId}
                  onChange={(e) => setPublishSiteId(e.target.value)}
                >
                  <option value="">{t("product.unpublished")}</option>
                  {(sites.data?.sites ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </Select>
              </div>
            </FilterBar>

            {products.isLoading ? (
              <ListPanel
                title={t("nav.products")}
                description={t("product.panelHint")}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <SearchField
                      placeholder="Search name, SKU…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search products"
                      disabled
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      {t("product.create")}
                    </Button>
                  </div>
                }
              >
                <div className="p-4">
                  <TableFrame>
                    <TableSkeleton />
                  </TableFrame>
                </div>
              </ListPanel>
            ) : (
              <ListPanel
                title={t("nav.products")}
                description={t("product.panelHint")}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <SearchField
                      placeholder="Search name, SKU…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search products"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      {t("product.create")}
                    </Button>
                  </div>
                }
              >
                <div className="space-y-3 p-4">
                  {productRows.length === 0 ? (
                    <EmptyState
                      variant="plain"
                      title={t("product.empty")}
                      description={
                        query
                          ? "No products match the search."
                          : "Add a product to start selling on this organization."
                      }
                      action={
                        query ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setQuery("")}
                          >
                            Clear search
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setCreateOpen(true)}
                          >
                            {t("product.create")}
                          </Button>
                        )
                      }
                    />
                  ) : (
                    <>
                      <BulkActionBar count={selectedIds.length}>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const selected = productRows.filter((p) =>
                              selectedIds.includes(p.id),
                            );
                            const csv = rowsToCsv(
                              [
                                "id",
                                "name",
                                "sku",
                                "priceCents",
                                "stock",
                                "status",
                                "siteId",
                                "currency",
                              ],
                              selected.map((p) => [
                                p.id,
                                p.name,
                                p.sku,
                                p.priceCents,
                                p.stock,
                                p.status,
                                p.siteId,
                                p.currency,
                              ]),
                            );
                            downloadCsv(
                              `products-selected-${selected.length}.csv`,
                              csv,
                            );
                          }}
                        >
                          Export selected CSV
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedIds([])}
                        >
                          Clear
                        </Button>
                      </BulkActionBar>
                      <TableFrame>
                        <Table>
                          <Thead>
                            <Tr>
                              <Th className="w-10">
                                <input
                                  type="checkbox"
                                  className="size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                  checked={allSelected}
                                  onChange={toggleAll}
                                  aria-label="Select all"
                                />
                              </Th>
                              <Th>Name</Th>
                              <Th>SKU</Th>
                              <Th>Price</Th>
                              <Th>Stock</Th>
                              <Th>Site</Th>
                              <Th>Status</Th>
                              <Th />
                            </Tr>
                          </Thead>
                          <Tbody>
                            {productRows.map((p) => (
                              <Tr key={p.id}>
                                <Td>
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => toggleRow(p.id)}
                                    aria-label={`Select ${p.name}`}
                                  />
                                </Td>
                                <Td>
                                  <strong>{p.name}</strong>
                                  <Muted as="div">/{p.slug}</Muted>
                                </Td>
                                <Td>
                                  <code>{p.sku}</code>
                                </Td>
                                <Td>
                                  {formatMoney(p.priceCents, p.currency, i18n.language)}
                                </Td>
                                <Td>{p.stock}</Td>
                                <Td>
                                  <Select
                                    value={p.siteId ?? ""}
                                    onChange={(e) =>
                                      attachSite.mutate({
                                        productId: p.id,
                                        siteId: e.target.value || null,
                                      })
                                    }
                                  >
                                    <option value="">
                                      {t("product.unpublished")}
                                    </option>
                                    {(sites.data?.sites ?? []).map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </Select>
                                  <Muted>{siteName(p.siteId)}</Muted>
                                </Td>
                                <Td>
                                  <Badge
                                    tone={
                                      p.status === "active"
                                        ? "success"
                                        : "muted"
                                    }
                                  >
                                    {productStatusLabel(p.status, t)}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleStatus.mutate(p)}
                                  >
                                    {p.status === "active"
                                      ? t("product.unpublish")
                                      : t("product.publish")}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setSelectedProductId(p.id)}
                                    data-active={
                                      selectedProductId === p.id
                                        ? "true"
                                        : "false"
                                    }
                                  >
                                    {t("product.manage")}
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableFrame>
                    </>
                  )}
                </div>
              </ListPanel>
            )}

            <Dialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);
                if (!open) {
                  setError(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("product.create")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <FormField label={t("product.name")} htmlFor="p-name" size="full">
                    <Input
                      id="p-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSlug(slugify(e.target.value));
                        if (!sku)
                          setSku(`SKU-${slugify(e.target.value).toUpperCase()}`);
                      }}
                    />
                  </FormField>
                  <FormRow cols={2}>
                    <FormField label={t("product.slug")} htmlFor="p-slug" size="full">
                      <Input
                        id="p-slug"
                        className="font-mono text-xs"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </FormField>
                    <FormField label={t("product.sku")} htmlFor="p-sku" size="full">
                      <Input
                        id="p-sku"
                        className="font-mono text-xs"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                    </FormField>
                  </FormRow>
                  <FormField
                    label={t("product.description")}
                    htmlFor="p-desc"
                    size="full"
                  >
                    <Input
                      id="p-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormField>
                  <FormRow cols={3}>
                    <FormField label={t("product.price")} htmlFor="p-price" size="full">
                      <Input
                        id="p-price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </FormField>
                    <FormField label={t("product.stock")} htmlFor="p-stock" size="full">
                      <Input
                        id="p-stock"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </FormField>
                    <FormField
                      label={t("product.lowStock")}
                      htmlFor="p-low"
                      size="full"
                    >
                      <Input
                        id="p-low"
                        value={lowStock}
                        onChange={(e) => setLowStock(e.target.value)}
                        placeholder="optional"
                      />
                    </FormField>
                  </FormRow>
                  <FormField label={t("product.status")} htmlFor="p-status" size="full">
                    <Select
                      id="p-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as "draft" | "active")
                      }
                    >
                      <option value="active">active</option>
                      <option value="draft">draft</option>
                    </Select>
                  </FormField>
                  {error && !selectedProductId ? <Alert>{error}</Alert> : null}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => createProduct.mutate()}
                    disabled={!name || !selectedOrgId || createProduct.isPending}
                  >
                    {t("product.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet
              open={Boolean(selectedProductId)}
              onOpenChange={(open) => {
                if (!open) setSelectedProductId("");
              }}
            >
              <SheetContent
                side="right"
                className="w-full overflow-y-auto sm:max-w-2xl"
              >
                <SheetHeader>
                  <SheetTitle>
                    {selectedProduct
                      ? `${t("product.manage")}: ${selectedProduct.name}`
                      : t("product.manage")}
                  </SheetTitle>
                </SheetHeader>
                {selectedProduct ? (
                  <div className="space-y-6 pb-6">
                    <div>
                      <h3>{t("product.categories")}</h3>
                      {(orgCategories.data?.categories ?? []).length === 0 ? (
                        <EmptyState>{t("category.empty")}</EmptyState>
                      ) : (
                        <Stack gap="sm">
                          {(orgCategories.data?.categories ?? []).map((c) => (
                            <Checkbox
                              key={c.id}
                              id={`product-cat-${c.id}`}
                              checked={selectedCategoryIds.includes(c.id)}
                              onChange={() => toggleCategory(c.id)}
                              label={
                                <>
                                  {c.name} <code>{c.slug}</code>
                                </>
                              }
                            />
                          ))}
                        </Stack>
                      )}
                      <FormActions>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveProductCategories.mutate()}
                          disabled={!selectedProductId}
                        >
                          {t("product.categoriesSave")}
                        </Button>
                      </FormActions>
                    </div>

                    <div>
                      <h3>{t("product.variants")}</h3>
                      {(variants.data?.variants ?? []).length === 0 ? (
                        <EmptyState>{t("product.variantEmpty")}</EmptyState>
                      ) : (
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>{t("product.variantSku")}</Th>
                              <Th>{t("product.variantOptions")}</Th>
                              <Th>{t("product.variantPrice")}</Th>
                              <Th>{t("product.variantStock")}</Th>
                              <Th>{t("product.status")}</Th>
                              <Th />
                            </Tr>
                          </Thead>
                          <Tbody>
                            {(variants.data?.variants ?? []).map((v) => (
                              <Tr key={v.id}>
                                <Td>
                                  <code>{v.sku}</code>
                                </Td>
                                <Td>{formatOptions(v.optionsJson)}</Td>
                                <Td>
                                  {formatMoney(
                                    v.priceCents,
                                    selectedProduct.currency,
                                    i18n.language,
                                  )}
                                </Td>
                                <Td>{v.stock}</Td>
                                <Td>{v.status}</Td>
                                <Td>
                                  {Object.keys(v.optionsJson ?? {}).length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() => deleteVariant.mutate(v.id)}
                                    >
                                      {t("product.variantDelete")}
                                    </Button>
                                  ) : (
                                    <Muted>{t("product.variantDefault")}</Muted>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}

                      <p className="pt-2 text-sm font-semibold">
                        {t("product.variantAdd")}
                      </p>
                      <FormRow cols={3}>
                        <FormField
                          label={t("product.variantSku")}
                          htmlFor="v-sku"
                          size="full"
                        >
                          <Input
                            id="v-sku"
                            className="font-mono text-xs"
                            value={variantSku}
                            onChange={(e) => setVariantSku(e.target.value)}
                          />
                        </FormField>
                        <FormField
                          label={t("product.variantPrice")}
                          htmlFor="v-price"
                          size="full"
                        >
                          <Input
                            id="v-price"
                            value={variantPrice}
                            onChange={(e) => setVariantPrice(e.target.value)}
                          />
                        </FormField>
                        <FormField
                          label={t("product.variantStock")}
                          htmlFor="v-stock"
                          size="full"
                        >
                          <Input
                            id="v-stock"
                            value={variantStock}
                            onChange={(e) => setVariantStock(e.target.value)}
                          />
                        </FormField>
                      </FormRow>
                      <FormField
                        label={t("product.variantOptions")}
                        htmlFor="v-options"
                        size="md"
                      >
                        <Input
                          id="v-options"
                          className="font-mono text-xs"
                          value={variantOptions}
                          onChange={(e) => setVariantOptions(e.target.value)}
                        />
                      </FormField>
                      <FormField
                        label={t("product.status")}
                        htmlFor="v-status"
                        size="md"
                      >
                        <Select
                          id="v-status"
                          value={variantStatus}
                          onChange={(e) =>
                            setVariantStatus(e.target.value as "active" | "draft")
                          }
                        >
                          <option value="active">active</option>
                          <option value="draft">draft</option>
                        </Select>
                      </FormField>
                      <FormActions>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => createVariant.mutate()}
                          disabled={!variantSku || !selectedProductId}
                        >
                          {t("product.variantAdd")}
                        </Button>
                      </FormActions>
                    </div>

                    <div>
                      <h3>{t("product.gallery")}</h3>
                      {gallery.data?.coverUrl ? (
                        <Muted>
                          {t("product.cover")}: {gallery.data.coverUrl}
                        </Muted>
                      ) : null}
                      {(gallery.data?.media ?? []).length === 0 ? (
                        <EmptyState>{t("product.galleryEmpty")}</EmptyState>
                      ) : (
                        <ul>
                          {(gallery.data?.media ?? []).map((m) => (
                            <li key={m.id}>
                              <a href={m.url} target="_blank" rel="noreferrer">
                                {m.url}
                              </a>{" "}
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => deleteGalleryImage.mutate(m.id)}
                              >
                                {t("product.galleryRemove")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <FormField
                        label={t("product.galleryUrl")}
                        htmlFor="gallery-url"
                        size="lg"
                      >
                        <Input
                          id="gallery-url"
                          value={galleryUrl}
                          onChange={(e) => setGalleryUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </FormField>
                      <FormActions>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addGalleryImage.mutate()}
                          disabled={!galleryUrl || !selectedProductId}
                        >
                          {t("product.galleryAdd")}
                        </Button>
                      </FormActions>
                    </div>
                    {error && selectedProductId ? <Alert>{error}</Alert> : null}
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>
          </>
        )}
      </Stack>
    </PageContent>
  );
}
