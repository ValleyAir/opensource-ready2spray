# Phase 3: Simplify Org Model + Rename Sites to Properties

## Goal
Simplify the multi-tenant organization system to single-org per user (auto-created). Rename "sites" to "properties" in the UI. Add GPS-only property creation and a job history endpoint for properties.

---

## Changes Required

### 1. `server/db.ts` - Default org to enterprise/active
In the `getOrCreateUserOrganization` function, when creating a new org, set:
```typescript
subscriptionStatus: "active",
subscriptionPlan: "enterprise",
```

This ensures all new users get full access without billing.

### 2. `server/validation.ts` - GPS-only property creation
Update the `createSiteSchema` (site creation validation):
- Make `address` optional (currently required)
- Add `latitude` and `longitude` as optional number fields
- Validation: require EITHER (address) OR (latitude + longitude)

Example:
```typescript
export const createSiteSchema = z.object({
  customerId: z.number(),
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  polygon: z.any().optional(),
  acres: z.number().optional(),
}).refine(
  (data) => data.address || (data.latitude && data.longitude),
  { message: "Either address or GPS coordinates (latitude + longitude) required" }
);
```

### 3. `server/routers.ts` - Add job history endpoint, remove team router
**Add** `sites.getJobHistory` procedure:
```typescript
getJobHistory: protectedProcedure
  .input(z.object({ siteId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Query all jobs linked to this site
    // Include: job date, status, product used, any polygon data
    // Return sorted by date descending
    const jobs = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.siteId, input.siteId))
      .orderBy(desc(jobsTable.scheduledDate));
    return jobs;
  }),
```

**Remove:** `teamRouter` import and registration from the main appRouter.

### 4. Frontend label changes - "Sites" -> "Properties"
**Files to update:**

**`client/src/pages/Sites.tsx`:**
- Page title: "Properties" (was "Sites")
- "Add Property" button (was "Add Site")
- Form labels: "Property Name" (was "Site Name")
- All user-facing text referencing "site" should say "property"

**`client/src/components/DashboardLayout.tsx`:**
- Sidebar navigation item: label "Properties" (was "Sites")
- Keep the route path as `/sites` to avoid breaking changes (or rename route too)

**Any other components** referencing "site" in user-facing text - search for:
```
grep -ri "site" client/src/ --include="*.tsx" --include="*.ts" -l
```
Only change user-facing labels, NOT variable names or API endpoints.

### 5. `client/src/App.tsx` - Remove team/invitation routes
Remove:
- `/team` route (TeamManagement page)
- `/invite/:token` route (AcceptInvitation page)

---

## Verification
```bash
npm run build
```
- Create a property with address -> works
- Create a property with GPS coordinates only (no address) -> works
- Property displays correctly on map
- `sites.getJobHistory` returns jobs for a property
- "Properties" label appears in sidebar and page titles
- Team management pages are gone
