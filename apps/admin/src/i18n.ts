import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

function readStoredLng(): "en" | "fr" {
  try {
    const stored = localStorage.getItem("admin-lng");
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: typeof window !== "undefined" ? readStoredLng() : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
