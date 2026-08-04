/**
 * FB-035 members / invites — require DATABASE_URL and a migrated DB.
 * Skipped automatically when DATABASE_URL is unset (CI without services).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import {
  membership,
  organizationInvite,
} from "../../db/schema.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("FB-035 members and invites", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let ownerCookie = "";
  let inviteeCookie = "";
  let wrongCookie = "";
  let orgId = "";
  let ownerMembershipId = "";
  const password = "Password123!";
  const stamp = Date.now();
  const ownerEmail = `owner-${stamp}@example.com`;
  const inviteeEmail = `invitee-${stamp}@example.com`;
  const wrongEmail = `wrong-${stamp}@example.com`;

  async function signUp(
    app: ReturnType<typeof createApp>,
    email: string,
  ): Promise<string> {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: email }),
    });
    expect(res.status).toBeLessThan(400);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const cookieHeader =
      setCookie.map((c) => c.split(";")[0]).join("; ") ||
      res.headers.get("set-cookie")?.split(",")[0]?.split(";")[0] ||
      "";
    return cookieHeader;
  }

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    ownerCookie = await signUp(app, ownerEmail);
    inviteeCookie = await signUp(app, inviteeEmail);
    wrongCookie = await signUp(app, wrongEmail);
    expect(ownerCookie).toBeTruthy();
    expect(inviteeCookie).toBeTruthy();
    expect(wrongCookie).toBeTruthy();

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: `Invite Org ${stamp}`,
        slug: `invite-org-${stamp}`,
      }),
    });
    expect(orgRes.status).toBe(201);
    const orgBody = (await orgRes.json()) as { organization: { id: string } };
    orgId = orgBody.organization.id;

    const membersRes = await app.request(`/v1/organizations/${orgId}/members`, {
      headers: { cookie: ownerCookie },
    });
    expect(membersRes.status).toBe(200);
    const membersBody = (await membersRes.json()) as {
      members: Array<{ id: string; role: string; email: string }>;
    };
    const owner = membersBody.members.find((m) => m.role === "owner");
    expect(owner).toBeTruthy();
    ownerMembershipId = owner!.id;
  });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  it("creates invite, accept adds membership, revoke blocks accept", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const createRes = await app.request(`/v1/organizations/${orgId}/invites`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
      },
      body: JSON.stringify({ email: inviteeEmail, role: "editor" }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      invite: { id: string; token: string; status: string };
      acceptUrl: string;
    };
    expect(created.invite.status).toBe("pending");
    expect(created.acceptUrl).toContain(created.invite.token);

    const metaRes = await app.request(`/v1/invites/${created.invite.token}`);
    expect(metaRes.status).toBe(200);
    const meta = (await metaRes.json()) as {
      invite: { email: string; role: string; status: string };
    };
    expect(meta.invite.email).toBe(inviteeEmail.toLowerCase());
    expect(meta.invite.role).toBe("editor");

    const wrongAccept = await app.request(
      `/v1/invites/${created.invite.token}/accept`,
      {
        method: "POST",
        headers: { cookie: wrongCookie },
      },
    );
    expect(wrongAccept.status).toBe(403);
    const wrongBody = (await wrongAccept.json()) as { code: string };
    expect(wrongBody.code).toBe("EMAIL_MISMATCH");

    const acceptRes = await app.request(
      `/v1/invites/${created.invite.token}/accept`,
      {
        method: "POST",
        headers: { cookie: inviteeCookie },
      },
    );
    expect(acceptRes.status).toBe(200);

    const [mem] = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.organizationId, orgId),
          eq(membership.role, "editor"),
        ),
      )
      .limit(1);
    expect(mem).toBeTruthy();

    const [inviteRow] = await db
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.id, created.invite.id))
      .limit(1);
    expect(inviteRow?.status).toBe("accepted");
  });

  it("rejects invite as owner role and protects last owner", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const ownerInvite = await app.request(`/v1/organizations/${orgId}/invites`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
      },
      body: JSON.stringify({ email: `other-${stamp}@example.com`, role: "owner" }),
    });
    expect(ownerInvite.status).toBe(400);

    const demote = await app.request(
      `/v1/organizations/${orgId}/members/${ownerMembershipId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: ownerCookie,
        },
        body: JSON.stringify({ role: "admin" }),
      },
    );
    expect(demote.status).toBe(400);
    const demoteBody = (await demote.json()) as { code: string };
    expect(demoteBody.code).toBe("LAST_OWNER");

    const remove = await app.request(
      `/v1/organizations/${orgId}/members/${ownerMembershipId}`,
      {
        method: "DELETE",
        headers: { cookie: ownerCookie },
      },
    );
    expect(remove.status).toBe(400);
    const removeBody = (await remove.json()) as { code: string };
    expect(removeBody.code).toBe("LAST_OWNER");
  });

  it("revokes pending invite", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });
    const targetEmail = `revoke-${stamp}@example.com`;
    const revokeCookie = await signUp(app, targetEmail);

    const createRes = await app.request(`/v1/organizations/${orgId}/invites`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
      },
      body: JSON.stringify({ email: targetEmail, role: "viewer" }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      invite: { id: string; token: string };
    };

    const revokeRes = await app.request(
      `/v1/organizations/${orgId}/invites/${created.invite.id}`,
      {
        method: "DELETE",
        headers: { cookie: ownerCookie },
      },
    );
    expect(revokeRes.status).toBe(200);

    const metaRes = await app.request(`/v1/invites/${created.invite.token}`);
    expect(metaRes.status).toBe(200);
    const meta = (await metaRes.json()) as { invite: { status: string } };
    expect(meta.invite.status).toBe("revoked");

    const acceptRes = await app.request(
      `/v1/invites/${created.invite.token}/accept`,
      {
        method: "POST",
        headers: { cookie: revokeCookie },
      },
    );
    expect(acceptRes.status).toBe(400);
    const body = (await acceptRes.json()) as { code: string };
    expect(body.code).toBe("INVALID_STATUS");
  });
});
