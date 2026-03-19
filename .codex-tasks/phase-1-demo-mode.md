# Phase 1: Demo Mode + Stripe Bypass

## Goal
Remove all Stripe billing gates so the app is immediately usable with all features unlocked for testing. No feature changes - just bypass the billing wall.

## Status: Changes already applied in this codebase
The following changes have already been made. Verify they are correct and the app builds.

---

## Changes Required

### 1. `client/src/hooks/useSubscription.ts`
**Action:** Replace entire file with hardcoded demo values. Remove tRPC import.

The hook should return:
- `isActive: true`
- `hasOrganization: true`
- `hasSubscription: true`
- `creditsRemaining: 999999`
- `isOwnerBypass: true`
- `isLoading: false`

The `useSubscriptionActions` hook should return no-op mutate functions.

### 2. `server/stripeRouter.ts`
**Action:** Replace with stub router that returns demo data.

The `getSubscriptionStatus` procedure should return:
```typescript
{
  hasOrganization: true,
  hasSubscription: true,
  status: "active",
  plan: "enterprise",
  creditsTotal: 999999,
  creditsUsed: 0,
  creditsRemaining: 999999,
  isOwnerBypass: true
}
```

All other procedures (`createCheckout`, `purchaseCredits`, `getPortalUrl`) should be no-ops returning empty objects.

### 3. `server/_core/index.ts`
**Action:** Remove Stripe webhook registration.

Delete these lines:
```typescript
const { handleStripeWebhook } = await import('../webhookStripe');
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
```

Also remove the webhook API routes (lines for Zoho/FieldPulse/n8n/Zapier):
```typescript
const { authenticateApiKey, logApiRequest, handleJobWebhook, ... } = await import('../webhookApi');
app.use('/api/webhook', ...);
app.post('/api/webhook/jobs/:action', ...);
// etc.
```

### 4. `client/src/App.tsx`
**Action:** Remove signup/plan routes:
- Remove `/signup/organization` route
- Remove `/signup/plans` route
- Keep the lazy imports for now (removing routes is enough)

---

## Verification
```bash
npm run build
```
- App starts without errors
- Navigate to `/dashboard` - no redirect to signup/plans
- All sidebar menu items accessible
