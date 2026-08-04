import type { CSSProperties, ReactNode } from "react";
import { emailT, type EmailLocale } from "./i18n.js";

function money(cents: number, currency: string, locale: EmailLocale) {
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export type OrderEmailProps = {
  locale?: EmailLocale;
  orderPublicId: string;
  totalCents?: number;
  currency?: string;
  invoiceNumber?: string;
  carrier?: string;
  trackingNumber?: string;
};

const bodyStyle: CSSProperties = {
  backgroundColor: "#f6f6f6",
  fontFamily: "sans-serif",
};

const containerStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "24px auto",
  padding: "24px",
  maxWidth: "560px",
};

const headingStyle: CSSProperties = { fontSize: "20px", margin: "0 0 16px" };
const footerStyle: CSSProperties = { color: "#666", fontSize: "12px" };

function Layout(props: {
  locale: EmailLocale;
  preview: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <html lang={props.locale}>
      <head>
        <meta charSet="utf-8" />
        <title>{props.title}</title>
      </head>
      <body style={bodyStyle}>
        {/* Preview text for email clients */}
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
          {props.preview}
        </div>
        <div style={containerStyle}>
          <h1 style={headingStyle}>{props.title}</h1>
          {props.children}
          <hr />
          <p style={footerStyle}>{emailT(props.locale, "email.layout.footer")}</p>
        </div>
      </body>
    </html>
  );
}

export function OrderConfirmationEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  const total =
    props.totalCents != null && props.currency
      ? money(props.totalCents, props.currency, locale)
      : null;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.confirmation.preview", { id })}
      title={emailT(locale, "email.order.confirmation.title")}
    >
      <p>{emailT(locale, "email.order.confirmation.body", { id })}</p>
      {total ? (
        <p>{emailT(locale, "email.order.confirmation.total", { total })}</p>
      ) : null}
      <div>
        <p>{emailT(locale, "email.order.confirmation.followUp")}</p>
      </div>
    </Layout>
  );
}

export function OrderPaidEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  const total =
    props.totalCents != null && props.currency
      ? money(props.totalCents, props.currency, locale)
      : null;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.paid.preview", { id })}
      title={emailT(locale, "email.order.paid.title")}
    >
      <p>{emailT(locale, "email.order.paid.body", { id })}</p>
      {props.invoiceNumber ? (
        <p>
          {emailT(locale, "email.order.paid.invoice", {
            number: props.invoiceNumber,
          })}
        </p>
      ) : null}
      {total ? (
        <p>{emailT(locale, "email.order.paid.total", { total })}</p>
      ) : null}
    </Layout>
  );
}

export function OrderCancelledEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.cancelled.preview", { id })}
      title={emailT(locale, "email.order.cancelled.title")}
    >
      <p>{emailT(locale, "email.order.cancelled.body", { id })}</p>
    </Layout>
  );
}

export function OrderShippedEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.shipped.preview", { id })}
      title={emailT(locale, "email.order.shipped.title")}
    >
      <p>{emailT(locale, "email.order.shipped.body", { id })}</p>
      {props.carrier ? (
        <p>
          {emailT(locale, "email.order.shipped.carrier", {
            carrier: props.carrier,
          })}
        </p>
      ) : null}
      {props.trackingNumber ? (
        <p>
          {emailT(locale, "email.order.shipped.tracking", {
            tracking: props.trackingNumber,
          })}
        </p>
      ) : null}
    </Layout>
  );
}

export type OrgInviteEmailProps = {
  locale?: EmailLocale;
  organizationName: string;
  role: string;
  acceptUrl: string;
  inviterEmail?: string;
};

export function OrgInviteEmail(props: OrgInviteEmailProps) {
  const locale = props.locale ?? "en";
  const org = props.organizationName;
  const body = props.inviterEmail
    ? emailT(locale, "email.invite.bodyWithInviter", {
        org,
        role: props.role,
        inviter: props.inviterEmail,
      })
    : emailT(locale, "email.invite.body", { org, role: props.role });
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.invite.preview", { org })}
      title={emailT(locale, "email.invite.title")}
    >
      <p>{body}</p>
      <div>
        <p>
          {emailT(locale, "email.invite.accept")}{" "}
          <a href={props.acceptUrl} style={{ color: "#111" }}>
            {props.acceptUrl}
          </a>
        </p>
      </div>
    </Layout>
  );
}
