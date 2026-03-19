# Phase 2: Replace Auth (OAuth -> Email/Password + JWT)

## Goal
Replace the Manus OAuth authentication system with simple email/password auth using bcrypt for password hashing and the existing JWT infrastructure (jose library) for sessions.

## Status: Changes already applied in this codebase
The following changes have already been made. Verify they are correct and the app builds.

---

## Changes Required

### 1. `drizzle/schema.ts` - Add passwordHash column
Add to the `users` table definition:
```typescript
passwordHash: varchar("password_hash", { length: 255 }),
```

Then generate migration:
```bash
npx drizzle-kit generate
```

### 2. Create `server/auth.ts` - Password hashing utilities
New file with:
```typescript
import bcrypt from "bcrypt";
import * as db from "./db";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(email: string, password: string, name: string) {
  // Check if user already exists
  const existing = await db.getUserByEmail(email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  const openId = uuidv4(); // Generate UUID for openId field

  const user = await db.upsertUser({
    openId,
    email,
    name,
    passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await db.getUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  return user;
}
```

**Note:** You may need to add a `getUserByEmail` function to `server/db.ts` if it doesn't exist:
```typescript
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}
```

### 3. `server/_core/sdk.ts` - Strip OAuth, keep JWT
**Remove entirely:**
- `OAuthService` class
- `createOAuthHttpClient` function
- `exchangeCodeForToken` method
- `getUserInfo` method
- `getUserInfoWithJwt` method
- `deriveLoginMethod` method
- `axios` import
- All OAuth-related type imports from `./types/manusTypes`

**Keep:**
- `SDKServer` class with: `createSessionToken`, `signSession`, `verifySession`, `authenticateRequest`, `parseCookies`, `getSessionSecret`
- `SessionPayload` type
- `jose` imports

**Simplify `authenticateRequest`:**
- Remove the OAuth sync fallback (the block that calls `getUserInfoWithJwt` when user not found in DB)
- If user not in DB after JWT verification, just throw `ForbiddenError("User not found")`
- Keep the dev mode synthetic user logic
- Remove all Supabase comments

### 4. `server/_core/oauth.ts` - Replace with email/password auth routes
Replace the entire file. New implementation:
```typescript
import { Express, Request, Response } from "express";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { registerUser, loginUser } from "../auth";

export function registerOAuthRoutes(app: Express) {
  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      const user = await registerUser(email, password, name);
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
      console.error("[Auth] Registration failed:", error);
      return res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await loginUser(email, password);
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
      console.error("[Auth] Login failed:", error);
      return res.status(401).json({ error: error.message || "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    return res.json({ success: true, redirect: "/login" });
  });

  console.log("[Auth] Email/password authentication routes registered");
}
```

**Keep the function name `registerOAuthRoutes`** so `index.ts` doesn't need changes, or rename both.

### 5. `server/_core/context.ts` - Use direct DB call for org
Replace `sdk.getOrCreateUserOrganization` with:
```typescript
import { getOrCreateUserOrganization } from "../db";
// ...
const org = await getOrCreateUserOrganization(user.id);
orgId = org.id;
```

Change `orgId` type from `string | null` to `number | null` (org IDs are integers).

### 6. Create `client/src/pages/Login.tsx`
Simple login form:
- Email and password fields
- POST to `/api/auth/login`
- On success, redirect to `/dashboard`
- Link to `/register` for new users
- Use existing shadcn/ui components (Card, Input, Button, Label)
- Handle error messages from server

### 7. Create `client/src/pages/Register.tsx`
Registration form:
- Name, email, password, confirm password fields
- POST to `/api/auth/register`
- On success, redirect to `/dashboard`
- Link to `/login` for existing users
- Client-side validation (password match, min length)

### 8. `client/src/App.tsx` - Add auth routes
Add routes:
```tsx
<Route path="/login" component={Login} />
<Route path="/register" component={Register} />
```

Default redirect from `/` should go to `/login` if not authenticated.

### 9. `client/src/_core/hooks/useAuth.ts`
Update the login redirect to point to `/login` instead of any OAuth URL.

### 10. `client/src/const.ts`
Update `getLoginUrl()` to return `/login`.
Remove `isOAuthConfigured()` if it exists.

---

## Key Decisions
- `openId` on users = UUID generated at registration (preserves FK references throughout codebase)
- Organizations auto-created per user via `getOrCreateUserOrganization` in `server/db.ts`
- Dev login (`/api/auth/dev-login`) continues to work unchanged

## Verification
```bash
npm run build
```
- Register a new user at `/register`
- Login at `/login` with those credentials
- JWT cookie is set, `trpc.auth.me` returns the user
- Protected routes work (e.g., `/dashboard`)
- Dev login still works via `POST /api/auth/dev-login`
