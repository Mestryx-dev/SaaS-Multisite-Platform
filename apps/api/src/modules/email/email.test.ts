import { describe, expect, it } from "vitest";
import { loadConfig } from "../../lib/config.js";
import { emailT, normalizeEmailLocale } from "./i18n.js";
import { sendOrderEmail } from "./send.js";

describe("email i18n", () => {
  it("normalizes locale", () => {
    expect(normalizeEmailLocale("fr")).toBe("fr");
    expect(normalizeEmailLocale("fr-FR")).toBe("fr");
    expect(normalizeEmailLocale("en")).toBe("en");
    expect(normalizeEmailLocale(undefined)).toBe("en");
  });

  it("translates subjects with interpolation", () => {
    expect(emailT("en", "email.order.confirmation.subject", { id: "ord_1" })).toBe(
      "Order confirmation — ord_1",
    );
    expect(emailT("fr", "email.order.confirmation.subject", { id: "ord_1" })).toBe(
      "Confirmation de commande — ord_1",
    );
  });

  it("falls back to EN then key", () => {
    expect(emailT("fr", "email.order.confirmation.title")).toBe(
      "Confirmation de commande",
    );
    expect(emailT("en", "email.missing.key")).toBe("email.missing.key");
  });
});

describe("sendOrderEmail", () => {
  it("soft-fails to log mode without RESEND_API_KEY", async () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const config = loadConfig();
    const result = await sendOrderEmail(config, {
      type: "order_confirmation",
      to: "buyer@example.com",
      orderPublicId: "ord_test123",
      totalCents: 1990,
      currency: "eur",
      locale: "fr",
    });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("log");
    if (prev !== undefined) process.env.RESEND_API_KEY = prev;
  });
});
