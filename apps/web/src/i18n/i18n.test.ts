import { describe, expect, it } from "vitest";
import {
  chromeMessages,
  getDictionary,
  normalizeLocale,
  t,
} from "./index.js";

describe("store i18n", () => {
  it("normalizes locale to en|fr", () => {
    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("fr-FR")).toBe("fr");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale("de")).toBe("en");
  });

  it("translates known keys and interpolates vars", () => {
    expect(t("en", "store.cart.title")).toBe("Your cart");
    expect(t("fr", "store.cart.title")).toBe("Votre panier");
    expect(t("en", "store.cart.subtotal", { amount: "12,00 €" })).toBe(
      "Subtotal 12,00 €",
    );
    expect(t("fr", "store.pdp.inStock", { count: 3 })).toBe("3 en stock");
  });

  it("falls back to EN then key when missing", () => {
    expect(t("fr", "store.cart.title")).toBe("Votre panier");
    // Force missing FR by using a key only present conceptually — unknown key
    expect(t("fr", "store.missing.never")).toBe("store.missing.never");
    // EN catalog hit when FR missing: simulate via unknown locale path already covered;
    // known EN-only would fall through — assert EN dictionary has cart.title
    expect(getDictionary("en")["store.cart.title"]).toBeTruthy();
  });

  it("falls back to EN string when key exists only in EN", () => {
    const enOnlyKey = "__test.en.only__";
    const en = getDictionary("en");
    const fr = getDictionary("fr");
    // Mutate copies would not work on imports — test fallback path with spy-free approach:
    // t returns EN when FR lacks key but EN has it — covered by catalogs always being parity.
    // Explicit unit: when FR dictionary lookup fails, EN is used.
    expect(fr[enOnlyKey]).toBeUndefined();
    en[enOnlyKey] = "English only";
    expect(t("fr", enOnlyKey)).toBe("English only");
    delete en[enOnlyKey];
  });

  it("chromeMessages returns cart subset", () => {
    const msgs = chromeMessages("fr");
    expect(msgs["store.cart.loading"]).toBe("Chargement du panier…");
    expect(msgs["store.nav.cart"]).toBeUndefined();
    expect(Object.keys(msgs).length).toBeGreaterThanOrEqual(6);
  });
});
