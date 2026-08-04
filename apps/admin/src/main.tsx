import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "@mestryx/tokens/fonts";
import "@mestryx/tokens/css";
import "@mestryx/ui/styles.css";
import "./styles.css";
import { Shell } from "./components/Shell";
import { DashboardPage } from "./pages/DashboardPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PagesPage } from "./pages/PagesPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ShippingPage } from "./pages/ShippingPage";
import { CouponsPage } from "./pages/CouponsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { MembersPage } from "./pages/MembersPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { BillingPage } from "./pages/BillingPage";
import { ModulesPage } from "./pages/ModulesPage";
import { ReturnsPage } from "./pages/ReturnsPage";
import { BannersPage } from "./pages/BannersPage";
import { MediaLibraryPage } from "./pages/MediaLibraryPage";
import { MenusPage } from "./pages/MenusPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SitesPage } from "./pages/SitesPage";

const rootRoute = createRootRoute({
  component: Shell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const sitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites",
  component: SitesPage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsPage,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories",
  component: CategoriesPage,
});

const pagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages",
  component: PagesPage,
});

const mediaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/media",
  component: MediaLibraryPage,
});

const menusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menus",
  component: MenusPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

const shippingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shipping",
  component: ShippingPage,
});

const couponsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coupons",
  component: CouponsPage,
});

const bannersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/banners",
  component: BannersPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: MembersPage,
});

const billingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/billing",
  component: BillingPage,
});

const modulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/modules",
  component: ModulesPage,
});

const returnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/returns",
  component: ReturnsPage,
});

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accept-invite",
  component: AcceptInvitePage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInPage,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  component: SignUpPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  sitesRoute,
  productsRoute,
  categoriesRoute,
  pagesRoute,
  mediaRoute,
  menusRoute,
  ordersRoute,
  shippingRoute,
  couponsRoute,
  bannersRoute,
  reportsRoute,
  membersRoute,
  billingRoute,
  modulesRoute,
  returnsRoute,
  acceptInviteRoute,
  orderDetailRoute,
  signInRoute,
  signUpRoute,
]);

const router = createRouter({ routeTree });
const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

document.documentElement.setAttribute(
  "data-theme",
  (() => {
    try {
      return window.localStorage.getItem("admin-theme") === "platform-light"
        ? "platform-light"
        : "platform";
    } catch {
      return "platform";
    }
  })(),
);
document.documentElement.style.colorScheme =
  document.documentElement.getAttribute("data-theme") === "platform-light"
    ? "light"
    : "dark";

/** Dev tip: open `/?bootPreview` (or `/?bootPreview=4000`) to hold the HTML splash before React mounts. */
async function mountAdmin() {
  const el = document.getElementById("root");
  if (!el) return;

  const params = new URLSearchParams(window.location.search);
  if (params.has("bootPreview")) {
    const raw = params.get("bootPreview");
    const ms = raw && /^\d+$/.test(raw) ? Number(raw) : 3000;
    await new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  createRoot(el).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void mountAdmin();
