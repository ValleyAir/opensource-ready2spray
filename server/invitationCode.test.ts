import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userOverrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 5001,
    openId: "test-invite-user",
    email: "testinvite@example.com",
    name: "Test Invite User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...userOverrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Invitation Code", () => {
  it("validates INVITATION_CODE environment variable is set", async () => {
    const invitationCode = process.env.INVITATION_CODE;
    expect(invitationCode).toBeDefined();
    expect(invitationCode).toBeTruthy();
    expect(typeof invitationCode).toBe("string");
    expect(invitationCode.length).toBeGreaterThan(0);
  });

  it("rejects organization creation with invalid invitation code", async () => {
    await upsertUser({
      id: 5001,
      openId: "test-invite-user",
      email: "testinvite@example.com",
      name: "Test Invite User",
      loginMethod: "manus",
      role: "user",
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stripe.createOrganization({
        name: "Test Org",
        mode: "ag_aerial",
        invitationCode: "WRONG_CODE",
      })
    ).rejects.toThrow("Invalid invitation code");
  });

  it("accepts organization creation with correct invitation code", async () => {
    await upsertUser({
      id: 5002,
      openId: "test-invite-user-2",
      email: "testinvite2@example.com",
      name: "Test Invite User 2",
      loginMethod: "manus",
      role: "user",
    });

    const ctx = createAuthContext({
      id: 5002,
      openId: "test-invite-user-2",
      email: "testinvite2@example.com",
    });
    const caller = appRouter.createCaller(ctx);

    const validCode = process.env.INVITATION_CODE!;
    const result = await caller.stripe.createOrganization({
      name: "Valid Invite Org",
      mode: "ag_aerial",
      invitationCode: validCode,
    });

    expect(result.organization).toBeDefined();
    expect(result.organization.name).toBe("Valid Invite Org");
  });
});
