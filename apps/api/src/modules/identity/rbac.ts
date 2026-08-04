import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { membership } from "../../db/schema.js";

export type MembershipRole = "owner" | "admin" | "editor" | "viewer";

const roleRank: Record<MembershipRole, number> = {
  owner: 40,
  admin: 30,
  editor: 20,
  viewer: 10,
};

export function roleAtLeast(role: MembershipRole, required: MembershipRole): boolean {
  return roleRank[role] >= roleRank[required];
}

export async function getMembership(
  db: Db,
  userId: string,
  organizationId: string,
) {
  const rows = await db
    .select()
    .from(membership)
    .where(
      and(eq(membership.userId, userId), eq(membership.organizationId, organizationId)),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function assertOrgRole(
  db: Db,
  userId: string,
  organizationId: string,
  required: MembershipRole,
) {
  const m = await getMembership(db, userId, organizationId);
  if (!m) {
    return { ok: false as const, code: "FORBIDDEN", message: "Not a member of organization" };
  }
  if (!roleAtLeast(m.role, required)) {
    return { ok: false as const, code: "FORBIDDEN", message: "Insufficient role" };
  }
  return { ok: true as const, membership: m };
}
