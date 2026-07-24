import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "admin-active-org-id";

type WorkspaceContextValue = {
  orgId: string;
  setOrgId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function readStoredOrgId(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredOrgId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function WorkspaceProvider({
  children,
  orgIds,
}: {
  children: ReactNode;
  /** Known organization ids — used to validate / default selection. */
  orgIds: string[];
}) {
  const [orgId, setOrgIdState] = useState(() => readStoredOrgId());

  const setOrgId = useCallback((id: string) => {
    setOrgIdState(id);
    writeStoredOrgId(id);
  }, []);

  useEffect(() => {
    if (orgIds.length === 0) return;
    if (orgId && orgIds.includes(orgId)) return;
    setOrgId(orgIds[0]!);
  }, [orgIds, orgId, setOrgId]);

  const value = useMemo(
    () => ({ orgId, setOrgId }),
    [orgId, setOrgId],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/** Active org for list pages — falls back to empty until provider mounts. */
export function useWorkspaceOrg(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    return {
      orgId: "",
      setOrgId: () => {
        /* no-op outside shell */
      },
    };
  }
  return ctx;
}

/**
 * Resolve org for a page: workspace selection → stored → preferred slug → first.
 */
export function pickOrgId(
  workspaceOrgId: string,
  orgs: { id: string; slug?: string }[],
  preferredSlug = "luna-bijoux",
): string {
  if (workspaceOrgId && orgs.some((o) => o.id === workspaceOrgId)) {
    return workspaceOrgId;
  }
  const stored = readStoredOrgId();
  if (stored && orgs.some((o) => o.id === stored)) return stored;
  const preferred = orgs.find((o) => o.slug === preferredSlug);
  return preferred?.id ?? orgs[0]?.id ?? "";
}

/** Convenience: workspace org id resolved against a loaded org list. */
export function useSelectedOrgId(
  orgs: { id: string; slug?: string }[],
  preferredSlug = "luna-bijoux",
): string {
  const { orgId } = useWorkspaceOrg();
  return pickOrgId(orgId, orgs, preferredSlug);
}
