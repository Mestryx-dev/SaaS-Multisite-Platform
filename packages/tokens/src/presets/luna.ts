import { storefrontBaseTokens } from "./storefront-base.js";
import type { ThemePresetMeta } from "./types.js";

/** Luna Bijoux — Studio light palette on universal storefront base. */
export const lunaPreset: ThemePresetMeta = {
  id: "luna",
  label: "Luna Bijoux",
  tokens: {
    ...storefrontBaseTokens,
    // Keep Fraunces display; mood is jewelry-soft via Studio warm primary.
  },
};
