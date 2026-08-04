/** Operator-facing labels for commerce / CMS status codes. */

export function orderStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  switch (status) {
    case "pending_payment":
      return t("order.status.pending_payment");
    case "paid":
      return t("order.status.paid");
    case "fulfilled":
      return t("order.status.fulfilled");
    case "cancelled":
      return t("order.status.cancelled");
    default:
      return status.replaceAll("_", " ");
  }
}

export function orderStatusTone(status: string): {
  badge: "success" | "danger" | "muted" | "info" | "default";
  dot: "ok" | "warn" | "danger" | "idle" | "info";
} {
  switch (status) {
    case "paid":
    case "fulfilled":
      return { badge: "success", dot: "ok" };
    case "pending_payment":
      return { badge: "info", dot: "warn" };
    case "cancelled":
      return { badge: "danger", dot: "danger" };
    default:
      return { badge: "muted", dot: "idle" };
  }
}

export function productStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  if (status === "active") return t("product.statusActive");
  if (status === "draft") return t("product.statusDraft");
  return status;
}

export function menuActiveLabel(
  active: boolean,
  t: (key: string) => string,
): string {
  return active ? t("menu.active") : t("menu.inactive");
}
