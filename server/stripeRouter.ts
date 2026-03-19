/**
 * Stripe Router - DEMO MODE STUB
 * All billing features bypassed, returns active status
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

export const stripeRouter = router({
  getSubscriptionStatus: protectedProcedure.query(async () => {
    return {
      hasOrganization: true,
      hasSubscription: true,
      status: "active",
      plan: "enterprise",
      creditsTotal: 999999,
      creditsUsed: 0,
      creditsRemaining: 999999,
      isOwnerBypass: true,
    };
  }),

  createOrganization: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      mode: z.enum(["ag_aerial", "residential_pest", "both"]).default("ag_aerial"),
      invitationCode: z.string().optional(),
    }))
    .mutation(async () => {
      return { success: true, organizationId: "demo" };
    }),

  createCheckout: protectedProcedure
    .input(z.object({ priceId: z.string() }).optional())
    .mutation(async () => {
      return { checkoutUrl: null };
    }),

  purchaseCredits: protectedProcedure
    .input(z.object({ addonId: z.string() }).optional())
    .mutation(async () => {
      return { checkoutUrl: null };
    }),

  getPortalUrl: protectedProcedure.mutation(async () => {
    return { portalUrl: null };
  }),

  getPlans: protectedProcedure.query(async () => {
    return [];
  }),

  getCreditAddons: protectedProcedure.query(async () => {
    return [];
  }),
});
