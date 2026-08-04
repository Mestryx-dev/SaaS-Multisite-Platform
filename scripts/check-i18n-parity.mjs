#!/usr/bin/env node
/**
 * Fail if EN/FR locale catalogs diverge (key set parity).
 * Surfaces: admin, store (when present), email (when present).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ name: string; en: string; fr: string }[]} */
const catalogs = [
  {
    name: "admin",
    en: "apps/admin/src/locales/en.json",
    fr: "apps/admin/src/locales/fr.json",
  },
  {
    name: "store",
    en: "apps/web/src/i18n/locales/en.json",
    fr: "apps/web/src/i18n/locales/fr.json",
  },
  {
    name: "email",
    en: "apps/api/src/modules/email/locales/en.json",
    fr: "apps/api/src/modules/email/locales/fr.json",
  },
  {
    name: "marketing",
    en: "apps/marketing/src/i18n/en.json",
    fr: "apps/marketing/src/i18n/fr.json",
  },
];

function loadKeys(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) return null;
  const json = JSON.parse(readFileSync(path, "utf8"));
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error(`${rel}: expected a flat JSON object`);
  }
  return new Set(Object.keys(json));
}

let failed = false;

for (const cat of catalogs) {
  const enKeys = loadKeys(cat.en);
  const frKeys = loadKeys(cat.fr);
  if (enKeys === null && frKeys === null) {
    console.log(`[skip] ${cat.name}: catalogs not present yet`);
    continue;
  }
  if (enKeys === null || frKeys === null) {
    console.error(
      `[fail] ${cat.name}: one of EN/FR is missing (${cat.en} / ${cat.fr})`,
    );
    failed = true;
    continue;
  }
  const missingFr = [...enKeys].filter((k) => !frKeys.has(k)).sort();
  const missingEn = [...frKeys].filter((k) => !enKeys.has(k)).sort();
  if (missingFr.length || missingEn.length) {
    failed = true;
    console.error(`[fail] ${cat.name}: key parity broken`);
    if (missingFr.length) {
      console.error(`  missing in FR (${missingFr.length}):`, missingFr.join(", "));
    }
    if (missingEn.length) {
      console.error(`  missing in EN (${missingEn.length}):`, missingEn.join(", "));
    }
  } else {
    console.log(`[ok] ${cat.name}: ${enKeys.size} keys (EN ↔ FR)`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("i18n parity OK");
