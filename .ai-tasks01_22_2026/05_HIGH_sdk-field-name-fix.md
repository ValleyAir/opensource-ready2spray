# Task 5: Fix SDK Field Name (license_number -> licenseNumber)

**Agent:** Aider
**Priority:** HIGH

## File to Modify

`server/_core/sdk.ts` (line 287)

## Changes Required

In the synthetic dev user object returned around line 278-292, change `license_number` to `licenseNumber`:

```typescript
// BEFORE
return {
  id: 1,
  openId: sessionUserId,
  name: process.env.OWNER_NAME || "Local Admin",
  email: process.env.OWNER_EMAIL || "admin@localhost",
  loginMethod: "dev",
  role: "admin",
  userRole: "owner",
  phone: null,
  license_number: null,  // WRONG - snake_case
  commission: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: signedInAt,
} as User;

// AFTER
return {
  id: 1,
  openId: sessionUserId,
  name: process.env.OWNER_NAME || "Local Admin",
  email: process.env.OWNER_EMAIL || "admin@localhost",
  loginMethod: "dev",
  role: "admin",
  userRole: "owner",
  phone: null,
  licenseNumber: null,  // CORRECT - camelCase matching schema
  commission: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: signedInAt,
} as User;
```

## Verification

```bash
pnpm run check 2>&1 | grep -i "sdk.ts\|license"
```
