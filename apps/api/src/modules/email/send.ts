import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import type { AppConfig } from "../../lib/config.js";
import { log } from "../../lib/logger.js";
import { emailT, type EmailLocale } from "./i18n.js";
import {
  OrderCancelledEmail,
  OrderConfirmationEmail,
  OrderPaidEmail,
  OrderShippedEmail,
  OrgInviteEmail,
  type OrderEmailProps,
  type OrgInviteEmailProps,
} from "./templates.js";

export type OrderEmailType =
  | "order_confirmation"
  | "order_paid"
  | "order_cancelled"
  | "order_shipped";

export type SendOrderEmailInput = OrderEmailProps & {
  type: OrderEmailType;
  to: string;
};

const subjectKeys: Record<OrderEmailType, string> = {
  order_confirmation: "email.order.confirmation.subject",
  order_paid: "email.order.paid.subject",
  order_cancelled: "email.order.cancelled.subject",
  order_shipped: "email.order.shipped.subject",
};

function templateElement(type: OrderEmailType, props: OrderEmailProps) {
  switch (type) {
    case "order_confirmation":
      return createElement(OrderConfirmationEmail, props);
    case "order_paid":
      return createElement(OrderPaidEmail, props);
    case "order_cancelled":
      return createElement(OrderCancelledEmail, props);
    case "order_shipped":
      return createElement(OrderShippedEmail, props);
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/**
 * Soft-fail transactional mail: never throws to callers.
 * Without RESEND_API_KEY → log-only (local dogfood).
 */
export async function sendOrderEmail(
  config: AppConfig,
  input: SendOrderEmailInput,
): Promise<{ ok: boolean; mode: "resend" | "log"; error?: string }> {
  const { type, to, ...props } = input;
  const locale: EmailLocale = props.locale ?? "en";
  const subject = emailT(locale, subjectKeys[type], {
    id: props.orderPublicId,
  });

  log("info", "order_email", {
    type,
    email: to,
    orderId: props.orderPublicId,
    invoice: props.invoiceNumber,
    locale,
    mode: config.resendApiKey ? "resend" : "log",
  });

  if (!config.resendApiKey) {
    return { ok: true, mode: "log" };
  }

  try {
    const html = await render(templateElement(type, { ...props, locale }));
    const resend = new Resend(config.resendApiKey);
    const result = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
    if (result.error) {
      log("error", "order_email_failed", {
        type,
        email: to,
        orderId: props.orderPublicId,
        error: result.error.message,
      });
      return { ok: false, mode: "resend", error: result.error.message };
    }
    return { ok: true, mode: "resend" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "order_email_failed", {
      type,
      email: to,
      orderId: props.orderPublicId,
      error: message,
    });
    return { ok: false, mode: "resend", error: message };
  }
}

/**
 * Soft-fail org invite mail (FB-035).
 */
export async function sendOrgInviteEmail(
  config: AppConfig,
  input: OrgInviteEmailProps & { to: string },
): Promise<{ ok: boolean; mode: "resend" | "log"; error?: string }> {
  const { to, ...props } = input;
  const locale: EmailLocale = props.locale ?? "en";
  const subject = emailT(locale, "email.invite.subject", {
    org: props.organizationName,
  });

  log("info", "org_invite_email", {
    email: to,
    org: props.organizationName,
    role: props.role,
    locale,
    mode: config.resendApiKey ? "resend" : "log",
    acceptUrl: props.acceptUrl,
  });

  if (!config.resendApiKey) {
    return { ok: true, mode: "log" };
  }

  try {
    const html = await render(
      createElement(OrgInviteEmail, { ...props, locale }),
    );
    const resend = new Resend(config.resendApiKey);
    const result = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
    if (result.error) {
      log("error", "org_invite_email_failed", {
        email: to,
        error: result.error.message,
      });
      return { ok: false, mode: "resend", error: result.error.message };
    }
    return { ok: true, mode: "resend" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "org_invite_email_failed", { email: to, error: message });
    return { ok: false, mode: "resend", error: message };
  }
}

/** FB-081 — soft-fail abandoned cart reminder. */
export async function sendAbandonedCartEmail(
  config: AppConfig,
  input: {
    to: string;
    customerName?: string | null;
    cartId: string;
    itemCount: number;
    locale?: EmailLocale;
  },
): Promise<{ ok: boolean; mode: "resend" | "log"; error?: string }> {
  const locale: EmailLocale = input.locale ?? "en";
  const subject = emailT(locale, "email.abandoned.subject");
  const name =
    input.customerName?.trim() ||
    emailT(locale, "email.abandoned.greetingFallback");
  const html = `<p>${emailT(locale, "email.abandoned.greeting", { name })}</p><p>${emailT(locale, "email.abandoned.body", { count: input.itemCount })}</p>`;

  log("info", "abandoned_cart_email", {
    email: input.to,
    cartId: input.cartId,
    itemCount: input.itemCount,
    locale,
    mode: config.resendApiKey ? "resend" : "log",
  });

  if (!config.resendApiKey) {
    return { ok: true, mode: "log" };
  }

  try {
    const resend = new Resend(config.resendApiKey);
    const result = await resend.emails.send({
      from: config.emailFrom,
      to: input.to,
      subject,
      html,
    });
    if (result.error) {
      log("error", "abandoned_cart_email_failed", {
        email: input.to,
        error: result.error.message,
      });
      return { ok: false, mode: "resend", error: result.error.message };
    }
    return { ok: true, mode: "resend" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "abandoned_cart_email_failed", {
      email: input.to,
      error: message,
    });
    return { ok: false, mode: "resend", error: message };
  }
}
