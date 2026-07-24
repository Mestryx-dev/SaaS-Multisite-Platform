import {
  Alert,
  Button,
  EmptyState,
  FilterBar,
  FormActions,
  FormField,
  FormPanel,
  Input,
  Label,
  PageContent,
  PageHeader,
  Select,
  TableSkeleton,
  SplitLayout,
  Stack,
  TableFrame,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch, slugify } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string; status: string };
type Category = {
  id: string;
  name: string;
  slug: string;
  siteId: string | null;
  organizationId: string;
};

export function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  }, [selectedOrgId]);

  useEffect(() => {
    const lunaSite = sites.data?.sites?.find((s) => s.slug === "luna");
    const first = sites.data?.sites?.[0]?.id ?? "";
    if (!siteId && (lunaSite?.id || first)) {
      setSiteId(lunaSite?.id ?? first);
    }
  }, [sites.data, siteId]);

  const categories = useQuery({
    queryKey: ["categories", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ categories: Category[] }>(
        `/v1/organizations/${selectedOrgId}/categories`,
      ),
  });

  const createCategory = useMutation({
    mutationFn: () =>
      apiFetch<{ category: Category }>("/v1/categories", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          siteId: siteId || null,
          name,
          slug: slug || slugify(name),
        }),
      }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/v1/categories/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = categories.data?.categories ?? [];

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.categories")}
          description="Organize the product tree."
        />

        <FilterBar>
          <div className="min-w-[12rem]">
            <Label htmlFor="cat-site">{t("product.publishSite")}</Label>
            <Select
              id="cat-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">{t("product.unpublished")}</option>
              {(sites.data?.sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <SplitLayout
          primary={
            categories.isLoading ? (
              <TableFrame>
                <TableSkeleton />
              </TableFrame>
            ) : rows.length === 0 ? (
              <EmptyState
                title={t("category.empty")}
                description="Create a category in the form beside this list."
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      document.getElementById("cat-name")?.focus()
                    }
                  >
                    {t("category.create")}
                  </Button>
                }
              />
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)]">
                  {rows.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span>
                        <strong>{cat.name}</strong>{" "}
                        <code className="text-xs text-[var(--muted-foreground)]">
                          {cat.slug}
                        </code>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory.mutate(cat.id)}
                      >
                        {t("category.delete")}
                      </Button>
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )
          }
          aside={
            <FormPanel title={t("category.create")} width="full">
              <FormField label={t("category.name")} htmlFor="cat-name" size="full">
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </FormField>
              <FormField label={t("category.slug")} htmlFor="cat-slug" size="full">
                <Input
                  id="cat-slug"
                  className="font-mono text-xs"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </FormField>
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => createCategory.mutate()}
                  disabled={!name || !selectedOrgId}
                >
                  {t("category.create")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
