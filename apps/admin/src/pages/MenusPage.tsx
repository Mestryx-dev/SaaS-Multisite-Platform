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
  ListPanel,
  PageContent,
  PageHeader,
  Select,
  SplitLayout,
  Stack,
  TableSkeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { menuActiveLabel } from "../lib/status-labels";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string };
type MenuItem = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
  active: boolean;
};
type MenuRecord = {
  id: string;
  location: "header" | "footer";
  items: MenuItem[];
};

export function MenusPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [location, setLocation] = useState<"header" | "footer">("header");
  const [panelTab, setPanelTab] = useState<"header" | "footer">("header");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("/");
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

  const menus = useQuery({
    queryKey: ["menus", siteId],
    enabled: Boolean(siteId),
    queryFn: () =>
      apiFetch<{ menus: MenuRecord[] }>(`/v1/sites/${siteId}/menus`),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/sites/${siteId}/menus/${location}/items`, {
        method: "POST",
        body: JSON.stringify({ label, href, sortOrder: 0, active: true }),
      }),
    onSuccess: async () => {
      setLabel("");
      setError(null);
      setPanelTab(location);
      await qc.invalidateQueries({ queryKey: ["menus", siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: (item: MenuItem) =>
      apiFetch(`/v1/menu-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !item.active }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menus", siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/v1/menu-items/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menus", siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const headerItems =
    menus.data?.menus?.find((m) => m.location === "header")?.items ?? [];
  const footerItems =
    menus.data?.menus?.find((m) => m.location === "footer")?.items ?? [];

  function focusAddForm() {
    document.getElementById("label")?.focus();
  }

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          title={t("nav.menus")}
          description="Navigation trees for storefronts."
        />

        <FilterBar>
          <div className="min-w-[12rem]">
            <Label htmlFor="menu-site">{t("product.site")}</Label>
            <Select
              id="menu-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
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
            <ListPanel
              title={t("nav.menus")}
              description="Header and footer links for the selected site."
              actions={
                <Button type="button" size="sm" onClick={focusAddForm}>
                  {t("menu.add")}
                </Button>
              }
            >
              {menus.isLoading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : (
                <Tabs
                  value={panelTab}
                  onValueChange={(v) =>
                    setPanelTab(v as "header" | "footer")
                  }
                  className="px-4 pb-4 pt-3"
                >
                  <TabsList variant="pills">
                    <TabsTrigger value="header">
                      {t("menu.header")} ({headerItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="footer">
                      {t("menu.footer")} ({footerItems.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="header" className="mt-0 pt-3">
                    <ItemList
                      items={headerItems}
                      emptyTitle={t("menu.empty")}
                      onToggle={(i) => toggle.mutate(i)}
                      onDelete={(id) => remove.mutate(id)}
                      onAdd={focusAddForm}
                      t={t}
                    />
                  </TabsContent>
                  <TabsContent value="footer" className="mt-0 pt-3">
                    <ItemList
                      items={footerItems}
                      emptyTitle={t("menu.empty")}
                      onToggle={(i) => toggle.mutate(i)}
                      onDelete={(id) => remove.mutate(id)}
                      onAdd={focusAddForm}
                      t={t}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </ListPanel>
          }
          aside={
            <FormPanel title={t("menu.add")} width="full">
              <FormField label={t("menu.location")} htmlFor="loc" size="full">
                <Select
                  id="loc"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value as "header" | "footer")
                  }
                >
                  <option value="header">header</option>
                  <option value="footer">footer</option>
                </Select>
              </FormField>
              <FormField label={t("menu.label")} htmlFor="label" size="full">
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </FormField>
              <FormField label={t("menu.href")} htmlFor="href" size="full">
                <Input
                  id="href"
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                />
              </FormField>
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => create.mutate()}
                  disabled={!label || !siteId}
                >
                  {t("menu.add")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}

function ItemList({
  items,
  emptyTitle,
  onToggle,
  onDelete,
  onAdd,
  t,
}: {
  items: MenuItem[];
  emptyTitle: string;
  onToggle: (i: MenuItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  t: (k: string) => string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="plain"
        icon={<Menu />}
        title={emptyTitle}
        description="Add a link to build this navigation tree."
        action={
          <Button type="button" size="sm" onClick={onAdd}>
            {t("menu.add")}
          </Button>
        }
      />
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)]">
      {items.map((i) => (
        <li
          key={i.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
        >
          <span>
            <strong>{i.label}</strong> → <code>{i.href}</code>{" "}
            <span className="text-[var(--muted-foreground)]">
              {menuActiveLabel(i.active, t)}
            </span>
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggle(i)}
            >
              {i.active ? t("menu.deactivate") : t("menu.activate")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(i.id)}
            >
              {t("menu.delete")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
