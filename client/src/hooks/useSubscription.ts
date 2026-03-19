/**
 * Hook to check subscription status - DEMO MODE (all features unlocked)
 */
export function useSubscription(_options?: { requireActive?: boolean }) {
  return {
    status: {
      hasOrganization: true,
      hasSubscription: true,
      status: "active" as const,
      plan: "enterprise",
      creditsTotal: 999999,
      creditsUsed: 0,
      creditsRemaining: 999999,
      isOwnerBypass: true,
    },
    isLoading: false,
    hasOrganization: true,
    hasSubscription: true,
    isActive: true,
    creditsRemaining: 999999,
    creditsTotal: 999999,
    creditsUsed: 0,
    isOwnerBypass: true,
  };
}

/**
 * Hook to get subscription management functions - DEMO MODE (no-ops)
 */
export function useSubscriptionActions() {
  return {
    createCheckout: { mutate: () => {}, isLoading: false },
    purchaseCredits: { mutate: () => {}, isLoading: false },
    getPortalUrl: { mutate: () => {}, isLoading: false },
  };
}
