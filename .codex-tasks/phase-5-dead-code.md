# Phase 5: Remove Dead Code (Stripe, Integrations, S3, Mailgun)

## Goal
Delete all files and code related to dropped features: Stripe billing, third-party integrations (Zoho, FieldPulse), Mailgun email, S3 storage, team management.

---

## Files to DELETE

### Server files:
- `server/stripe.ts` - Stripe SDK integration
- `server/products.ts` - Stripe product/pricing config (NOT the product CRUD in routers.ts!)
- `server/webhookStripe.ts` - Stripe webhook handler
- `server/email.ts` - Mailgun email sending
- `server/_core/notification.ts` - Mailgun-based notifications
- `server/dbOrganizations.ts` - Stripe-dependent org functions
- `server/dbOrganizationsExtended.ts` - Extended org queries
- `server/teamRouter.ts` - Team management router
- `server/webhookApi.ts` - External integration webhooks (Zoho/FieldPulse/n8n/Zapier)
- `server/ownerBypass.test.ts` - Stripe owner bypass tests
- `server/stripe.test.ts` - Stripe tests
- `server/stripe.validation.test.ts` - Stripe validation tests
- `server/_core/app.ts` - If this exists and is unused

### Client files:
- `client/src/pages/OrganizationSetup.tsx`
- `client/src/pages/PlanSelection.tsx`
- `client/src/pages/TeamManagement.tsx`
- `client/src/pages/AcceptInvitation.tsx`
- `client/src/pages/EmailTest.tsx`

### Root files:
- `test-query.mjs` - Legacy Supabase test

---

## Files to MODIFY

### `server/routers.ts`
**Remove these router sections/imports:**
- `integrations` router (integration connection CRUD, sync operations)
- `email` router (email test/send endpoints)
- Any imports of deleted files (`stripeRouter`, `teamRouter`, `webhookApi`, etc.)

**Keep:** All customer, job, product, site, equipment, personnel, AI, agrian, maps, weather, checklist, drift routers.

### `server/stripeRouter.ts`
**Keep this file** but ensure it's the stubbed demo version (from Phase 1). It should only return hardcoded demo data with no Stripe SDK imports.

### `server/db.ts`
**Remove:**
- Integration helper functions (anything referencing `integrationConnections`, `integrationFieldMappings`, `integrationSyncLogs`, `integrationEntityMappings`)
- Any functions only called by deleted files
- Keep ALL customer, job, product, site, equipment, personnel, org functions

### `server/_core/index.ts`
**Remove:**
- Stripe webhook registration (should already be gone from Phase 1)
- Webhook API routes (`/api/webhook/*` for external integrations)

**Should look like:**
```typescript
// Auth routes
registerOAuthRoutes(app);
registerDevAuthRoutes(app);

// Local file uploads
app.use('/uploads', express.static(uploadsDir));

// tRPC API
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Health checks
app.get('/api/health', ...);
app.get('/api/health/ready', ...);
```

### `server/storage.ts`
**Replace** any Forge/S3/external storage with local filesystem:
```typescript
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function saveFile(filename: string, data: Buffer): Promise<string> {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, data);
  return `/uploads/${filename}`;
}

export async function getFileUrl(filename: string): Promise<string> {
  return `/uploads/${filename}`;
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
```

### `client/src/App.tsx`
**Remove:**
- Lazy imports for deleted pages (OrganizationSetup, PlanSelection, TeamManagement, AcceptInvitation, EmailTest)
- Routes for those pages

---

## Critical: After deleting, grep for broken imports
```bash
# Find any imports of deleted files
grep -r "from.*stripeRouter\|from.*teamRouter\|from.*webhookApi\|from.*webhookStripe\|from.*email\|from.*notification\|from.*dbOrganizations\|from.*products\b" server/ --include="*.ts"

# Find any imports of deleted client pages
grep -r "OrganizationSetup\|PlanSelection\|TeamManagement\|AcceptInvitation\|EmailTest" client/src/ --include="*.tsx" --include="*.ts"
```

Fix any broken references before building.

---

## Verification
```bash
npm run build
```
- Build succeeds with no import errors
- No references to deleted files remain
- App starts and all remaining features work
- Map file uploads work with local storage (`./uploads/` directory)
