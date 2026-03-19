import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getOrCreateUserOrganization } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  orgId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let orgId: number | null = null;

  // Step 1: Authenticate user
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Step 2: Get/create organization (separate try so auth isn't lost on org failure)
  if (user) {
    try {
      const org = await getOrCreateUserOrganization(user.id);
      orgId = org.id;
    } catch (error) {
      console.error("[Context] Failed to get/create organization for user:", user.id, error);
      // User stays authenticated even if org lookup fails
      orgId = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    orgId,
  };
}
