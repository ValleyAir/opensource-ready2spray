# Task 2: Fix Permission Type (view_weather)

**Agent:** Aider
**Priority:** CRITICAL

## File to Modify

`client/src/hooks/usePermissions.ts`

## Changes Required

### 1. Add `view_weather` to Permission type union (around line 44)

```typescript
export type Permission =
  | "view_dashboard"
  // ... existing permissions ...
  | "view_settings"
  | "edit_settings"
  | "view_weather";  // ADD THIS LINE
```

### 2. Add `view_weather` to ALL role permission arrays

Add `"view_weather"` to the end of each role's permissions array:

- `owner` array (around line 88)
- `admin` array (around line 130)
- `manager` array (around line 169)
- `technician` array (around line 207)
- `pilot` array (around line 245)
- `sales` array (around line 283)

Example for each role:
```typescript
"view_ai_chat",
"view_maps",
"view_weather",  // ADD THIS LINE
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "view_weather\|Permission"
```
