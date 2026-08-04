/**
 * Saved list views (Wave C) — client-side named filter sets.
 * Persist per key in localStorage until server-backed views exist.
 */

export type SavedView = {
  id: string;
  name: string;
  /** Serialized query params / filter blob */
  payload: Record<string, string>;
  createdAt: string;
};

function storageKey(scope: string) {
  return `mx-admin-saved-views:${scope}`;
}

export function listSavedViews(scope: string): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveView(scope: string, view: Omit<SavedView, "id" | "createdAt">): SavedView {
  const next: SavedView = {
    ...view,
    id: `view_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const all = [...listSavedViews(scope), next];
  window.localStorage.setItem(storageKey(scope), JSON.stringify(all));
  return next;
}

export function deleteSavedView(scope: string, id: string) {
  const all = listSavedViews(scope).filter((v) => v.id !== id);
  window.localStorage.setItem(storageKey(scope), JSON.stringify(all));
}
