import {
  AppShell,
  AuthShell,
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  LoadingBlock,
  NavSection,
  RouteFade,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Toaster,
  navLinkClassName,
  cn,
} from "@mestryx/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CreditCard,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeft,
  Puzzle,
  Search,
  ShoppingBag,
  Sun,
  Moon,
  Tag,
  Truck,
  Undo2,
  Users,
  BarChart3,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { signInHrefWithReturn } from "../lib/auth-return";
import { WorkspaceProvider, useWorkspaceOrg, readStoredOrgId } from "../lib/workspace";

type Org = { id: string; name?: string; slug?: string; modulesAllowed?: string[] };

function AuthBrandMark() {
  return (
    <span
      className="relative flex size-14 items-center justify-center"
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full border border-primary/30 shadow-[0_0_0_6px] shadow-primary/10" />
      <span className="relative flex size-9 items-center justify-center rounded-[0.55rem] border border-primary/35 bg-card text-[1.05rem] font-bold tracking-[-0.04em] text-primary">
        M
      </span>
    </span>
  );
}

function shellNavClass(active: boolean, collapsed?: boolean) {
  return navLinkClassName(
    active,
    cn("ui-nav-link", collapsed && "justify-center px-2"),
  );
}

function NavItem({
  to,
  active,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string;
  active: boolean;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      className={shellNavClass(active, collapsed)}
      data-active={active ? "true" : "false"}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : (
        <span className="sr-only">{label}</span>
      )}
    </Link>
  );
}

type CmdItem = { to: string; label: string };

function PrimaryNav({
  collapsed,
  commerce,
  pathname,
  t,
  onNavigate,
}: {
  collapsed: boolean;
  commerce: boolean;
  pathname: string;
  t: (k: string) => string;
  onNavigate?: () => void;
}) {
  const commerceActive =
    pathname.startsWith("/products") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/returns") ||
    pathname.startsWith("/shipping") ||
    pathname.startsWith("/coupons") ||
    pathname.startsWith("/banners") ||
    pathname.startsWith("/reports");

  const c = collapsed;
  return (
    <>
      <NavSection label={t("nav.section.overview")} collapsed={c}>
        <NavItem
          to="/"
          active={pathname === "/"}
          icon={LayoutDashboard}
          label={t("nav.dashboard")}
          collapsed={c}
          onNavigate={onNavigate}
        />
      </NavSection>
      <NavSection label={t("nav.section.workspace")} collapsed={c}>
        <NavItem
          to="/sites"
          active={pathname.startsWith("/sites")}
          icon={Globe}
          label={t("nav.sites")}
          collapsed={c}
          onNavigate={onNavigate}
        />
      </NavSection>
      <NavSection label={t("nav.section.content")} collapsed={c}>
        <NavItem
          to="/pages"
          active={pathname.startsWith("/pages")}
          icon={FileText}
          label={t("nav.pages")}
          collapsed={c}
          onNavigate={onNavigate}
        />
        <NavItem
          to="/media"
          active={pathname.startsWith("/media")}
          icon={Image}
          label={t("nav.media")}
          collapsed={c}
          onNavigate={onNavigate}
        />
        <NavItem
          to="/menus"
          active={pathname.startsWith("/menus")}
          icon={Menu}
          label={t("nav.menus")}
          collapsed={c}
          onNavigate={onNavigate}
        />
      </NavSection>
      {commerce ? (
        <NavSection
          label={t("nav.section.commerce")}
          collapsible
          defaultOpen={false}
          storageKey="admin-nav-commerce"
          active={commerceActive}
          collapsed={c}
        >
          <NavItem
            to="/products"
            active={pathname.startsWith("/products")}
            icon={ShoppingBag}
            label={t("nav.products")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/categories"
            active={pathname.startsWith("/categories")}
            icon={Tag}
            label={t("nav.categories")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/orders"
            active={pathname.startsWith("/orders")}
            icon={Package}
            label={t("nav.orders")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/returns"
            active={pathname.startsWith("/returns")}
            icon={Undo2}
            label={t("nav.returns")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/shipping"
            active={pathname.startsWith("/shipping")}
            icon={Truck}
            label={t("nav.shipping")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/coupons"
            active={pathname.startsWith("/coupons")}
            icon={Tag}
            label={t("nav.coupons")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/banners"
            active={pathname.startsWith("/banners")}
            icon={Flag}
            label={t("nav.banners")}
            collapsed={c}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/reports"
            active={pathname.startsWith("/reports")}
            icon={BarChart3}
            label={t("nav.reports")}
            collapsed={c}
            onNavigate={onNavigate}
          />
        </NavSection>
      ) : null}
      <NavSection label={t("nav.section.organization")} collapsed={c}>
        <NavItem
          to="/members"
          active={pathname.startsWith("/members")}
          icon={Users}
          label={t("nav.members")}
          collapsed={c}
          onNavigate={onNavigate}
        />
        <NavItem
          to="/modules"
          active={pathname.startsWith("/modules")}
          icon={Puzzle}
          label={t("nav.modules")}
          collapsed={c}
          onNavigate={onNavigate}
        />
        <NavItem
          to="/billing"
          active={pathname.startsWith("/billing")}
          icon={CreditCard}
          label={t("nav.billing")}
          collapsed={c}
          onNavigate={onNavigate}
        />
      </NavSection>
    </>
  );
}

function OrgSwitcher({
  orgs,
  className,
  id = "shell-org",
}: {
  orgs: Org[];
  className?: string;
  id?: string;
}) {
  const { t } = useTranslation();
  const { orgId, setOrgId } = useWorkspaceOrg();
  if (orgs.length === 0) return null;
  return (
    <div className={className}>
      <Label htmlFor={id} className="sr-only">
        {t("product.org")}
      </Label>
      <Select
        id={id}
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        className="h-8 min-w-[9rem] max-w-[14rem] text-xs md:min-w-[10rem]"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name ?? o.slug ?? o.id}
          </option>
        ))}
      </Select>
    </div>
  );
}

function UserChip({ userEmail }: { userEmail?: string }) {
  if (!userEmail) return null;
  return (
    <div
      className="hidden items-center gap-2 sm:flex"
      title={userEmail}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-semibold text-[var(--foreground)]"
        aria-hidden
      >
        {userEmail.slice(0, 1).toUpperCase()}
      </div>
      <span className="max-w-[10rem] truncate text-xs text-[var(--muted-foreground)]">
        {userEmail}
      </span>
    </div>
  );
}

const ADMIN_THEME_KEY = "admin-theme";
type AdminTheme = "platform" | "platform-light";

function readAdminTheme(): AdminTheme {
  try {
    const raw = window.localStorage.getItem(ADMIN_THEME_KEY);
    if (raw === "platform-light") return "platform-light";
  } catch {
    /* ignore */
  }
  return "platform";
}

function applyAdminTheme(theme: AdminTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme =
    theme === "platform-light" ? "light" : "dark";
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function persistAdminLng(lng: "en" | "fr") {
  try {
    window.localStorage.setItem("admin-lng", lng);
  } catch {
    /* ignore */
  }
}

function HeaderLocaleToggle() {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith("fr") ? "fr" : "en";
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={t("shell.language")}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 min-h-8 px-2 text-[11px] font-semibold",
          lng === "en" && "bg-[var(--muted)] text-[var(--foreground)]",
        )}
        onClick={() => {
          persistAdminLng("en");
          void i18n.changeLanguage("en");
        }}
        aria-label={t("shell.langEn")}
        aria-pressed={lng === "en"}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 min-h-8 px-2 text-[11px] font-semibold",
          lng === "fr" && "bg-[var(--muted)] text-[var(--foreground)]",
        )}
        onClick={() => {
          persistAdminLng("fr");
          void i18n.changeLanguage("fr");
        }}
        aria-label={t("shell.langFr")}
        aria-pressed={lng === "fr"}
      >
        FR
      </Button>
    </div>
  );
}

function HeaderThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<AdminTheme>(() =>
    typeof window === "undefined" ? "platform" : readAdminTheme(),
  );
  const isLight = theme === "platform-light";

  function toggle() {
    const next: AdminTheme = isLight ? "platform" : "platform-light";
    applyAdminTheme(next);
    setTheme(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={toggle}
      aria-label={isLight ? t("shell.themeDark") : t("shell.themeLight")}
      title={isLight ? t("shell.themeDark") : t("shell.themeLight")}
    >
      {isLight ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </Button>
  );
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Default: icon rail (narrow). Only expand when user explicitly chose "0".
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("admin-sidebar-collapsed") !== "0";
  });

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await apiFetch<{ user?: { email?: string; name?: string | null } }>(
          "/api/auth/get-session",
        );
      } catch {
        return { user: undefined };
      }
    },
    retry: false,
  });

  const orgList = orgs.data?.organizations ?? [];
  const orgIds = useMemo(() => orgList.map((o) => o.id), [orgList]);
  const storedId = readStoredOrgId();
  const activeOrg =
    orgList.find((o) => o.id === storedId) ?? orgList[0];
  const modules = activeOrg?.modulesAllowed ?? ["cms"];
  const commerce = modules.includes("commerce");
  const userEmail = session.data?.user?.email;
  const signedIn = Boolean(userEmail);
  const sessionSettled = !session.isPending;

  useEffect(() => {
    if (!sessionSettled || signedIn) return;
    const href = signInHrefWithReturn(pathname, window.location.search);
    window.location.assign(href);
  }, [sessionSettled, signedIn, pathname, navigate]);

  const cmdItems = useMemo(() => {
    const base: CmdItem[] = [
      { to: "/", label: t("nav.dashboard") },
      { to: "/sites", label: t("nav.sites") },
      { to: "/pages", label: t("nav.pages") },
      { to: "/media", label: t("nav.media") },
      { to: "/menus", label: t("nav.menus") },
      { to: "/members", label: t("nav.members") },
      { to: "/modules", label: t("nav.modules") },
      { to: "/billing", label: t("nav.billing") },
    ];
    if (commerce) {
      base.push(
        { to: "/products", label: t("nav.products") },
        { to: "/categories", label: t("nav.categories") },
        { to: "/orders", label: t("nav.orders") },
        { to: "/returns", label: t("nav.returns") },
        { to: "/shipping", label: t("nav.shipping") },
        { to: "/coupons", label: t("nav.coupons") },
        { to: "/banners", label: t("nav.banners") },
        { to: "/reports", label: t("nav.reports") },
      );
    }
    return base;
  }, [commerce, t]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleSidebar() {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("admin-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const c = sidebarCollapsed;

  if (!sessionSettled || !signedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[image:var(--background-ambient)] bg-[var(--background)]">
        <LoadingBlock label={t("shell.loading")} size="md" />
      </div>
    );
  }

  return (
    <WorkspaceProvider orgIds={orgIds}>
      <AppShell
        brand={t("appName")}
        sidebarCollapsed={sidebarCollapsed}
        brandActions={
          <>
            <OrgSwitcher
              orgs={orgList}
              id="shell-org-top"
              className="hidden min-w-0 sm:block"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-8 shrink-0 md:inline-flex"
              aria-label={
                sidebarCollapsed
                  ? t("shell.expandSidebar")
                  : t("shell.collapseSidebar")
              }
              onClick={toggleSidebar}
            >
              <PanelLeft className="size-4" />
            </Button>
          </>
        }
        topBarLeading={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 md:hidden"
            aria-label={t("shell.openNavigation")}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        }
        nav={
          <PrimaryNav
            collapsed={c}
            commerce={commerce}
            pathname={pathname}
            t={t}
          />
        }
        topBar={
          <>
            <HeaderLocaleToggle />
            <HeaderThemeToggle />
            <UserChip userEmail={userEmail} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-9"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="size-3.5" aria-hidden />
              <kbd className="hidden text-[10px] opacity-70 sm:inline">⌘K</kbd>
            </Button>
          </>
        }
      >
        <RouteFade routeKey={pathname}>{children}</RouteFade>
      </AppShell>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(100%,18rem)] flex-col gap-0 bg-[var(--sidebar)] p-0 text-[var(--sidebar-foreground)]"
        >
          <SheetHeader className="border-b border-[var(--sidebar-border)] px-4 py-3">
            <SheetTitle className="text-base">{t("appName")}</SheetTitle>
          </SheetHeader>
          <nav
            className="ui-sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-4"
            aria-label={t("shell.primaryNav")}
          >
            <div className="flex flex-col gap-3">
              <PrimaryNav
                collapsed={false}
                commerce={commerce}
                pathname={pathname}
                t={t}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </nav>
          <div className="mt-auto space-y-3 border-t border-[var(--sidebar-border)] p-3">
            <OrgSwitcher orgs={orgList} id="shell-org-mobile" className="w-full" />
            <div className="flex items-center justify-between gap-2">
              <HeaderLocaleToggle />
              <HeaderThemeToggle />
            </div>
            {userEmail ? (
              <p className="truncate text-xs text-[var(--muted-foreground)]">{userEmail}</p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <CommandDialog
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        title={t("shell.cmdTitle")}
      >
        <CommandInput placeholder={t("shell.cmdPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("shell.cmdEmpty")}</CommandEmpty>
          <CommandGroup heading={t("shell.cmdNavigation")}>
            {cmdItems.map((item) => (
              <CommandItem
                key={item.to}
                value={item.label}
                onSelect={() => {
                  setCmdOpen(false);
                  void navigate({ to: item.to as "/" });
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Toaster />
    </WorkspaceProvider>
  );
}

export function Shell() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav =
    pathname.startsWith("/sign-") || pathname.startsWith("/accept-invite");

  if (hideNav) {
    return (
      <AuthShell mark={<AuthBrandMark />} productName={t("appName")}>
        <Outlet />
        <Toaster />
      </AuthShell>
    );
  }

  return (
    <AuthenticatedShell>
      <Outlet />
    </AuthenticatedShell>
  );
}
