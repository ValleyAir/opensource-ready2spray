# Task 10: Fix PreFlightChecklist Type Errors

**Agent:** Goose
**Priority:** MEDIUM

## Files to Verify

1. `client/src/pages/PreFlightChecklist.tsx` (lines 87, 88, 337)

## Changes Required

This task should be resolved by Task 8's job type alignment. Verify that:

### 1. Lines 87-88 work correctly

```typescript
if (initialData?.job?.personnelId) {
    setPilotId(initialData.job.personnelId.toString());
}
if (initialData?.job?.equipmentId) {
    setAircraftId(initialData.job.equipmentId.toString());
}
```

After Task 8, `job.personnelId` will exist (mapped from `assignedPersonnelId`).

### 2. Line 337 works correctly

```typescript
<span className="font-medium text-right max-w-[200px] truncate">
  {job.location || "Coordinates"}
</span>
```

After Task 8, `job.location` will exist (mapped from `locationAddress`).

## Verification

```bash
pnpm run check 2>&1 | grep -i "PreFlightChecklist"
```

If errors persist, add optional chaining:
```typescript
{job?.location || "Coordinates"}
```
