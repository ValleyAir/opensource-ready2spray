# Task 8: Fix Job Type Alignment

**Agent:** Goose
**Priority:** HIGH

## Files to Modify

1. `server/db.ts` (getJobV2ById function around line 1419)
2. `server/checklistRouter.ts` (line 48 - Zod fix)

## Changes Required

### 1. Map field names in getJobV2ById for backward compatibility

The `jobs` table uses:
- `locationLat` / `locationLng`
- `assignedPersonnelId`
- `locationAddress`

But code expects:
- `latitude` / `longitude`
- `personnelId`
- `location`

Update `getJobV2ById` in `server/db.ts`:

```typescript
// BEFORE
export async function getJobV2ById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  return result[0] || null;
}

// AFTER
export async function getJobV2ById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  const job = result[0];
  if (!job) return null;

  // Map field names for backward compatibility
  return {
    ...job,
    latitude: job.locationLat,
    longitude: job.locationLng,
    personnelId: job.assignedPersonnelId,
    location: job.locationAddress,
  };
}
```

### 2. Fix Zod 4 z.record() in checklistRouter.ts (line 48)

```typescript
// BEFORE
checklistData: z.record(z.any()),

// AFTER
checklistData: z.record(z.string(), z.any()),
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "db.ts\|checklistRouter\|getJobV2"
```
