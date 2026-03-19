# Task 1: Fix Import Paths and Add Missing Dependencies

**Agent:** Aider
**Priority:** CRITICAL (blocks all server compilation)

## Files to Modify

1. `server/_core/app.ts` (lines 4-10)
2. `server/_core/ollama.ts` (line 1)
3. `server/ollamaRouter.ts` (lines 1-2)
4. `package.json`

## Changes Required

### 1. Fix Import Paths

In `server/_core/app.ts`, replace broken imports:
```typescript
// WRONG - these paths don't exist
import { createTRPCContext } from "@/server_core/context";
import { t } from "@/server_core/trpc";
import { corsMiddleware } from "@/server_core/cors";
import { logApiRequest } from "@/server_core/webhookApi";
import { setupVite } from "@/server_core/vite";

// CORRECT - use relative paths
import { createContext } from "./context";
import { setupVite } from "./vite";
```

In `server/_core/ollama.ts`, fix line 1:
```typescript
// WRONG
import { InvokeParams, InvokeResult } from "@/server_core/llm";

// CORRECT
import { InvokeParams, InvokeResult } from "./llm";
```

In `server/ollamaRouter.ts`, fix lines 1-2:
```typescript
// WRONG
import { router, publicProcedure } from "@/server/_core/trpc";
import { ... } from "@/server/_core/ollama";

// CORRECT
import { router, publicProcedure } from "./_core/trpc";
import { ... } from "./_core/ollama";
```

### 2. Rewrite app.ts to use proper tRPC middleware

The app.ts file needs significant changes:
- Use `createExpressMiddleware` from `@trpc/server/adapters/express`
- Use `cors` package instead of non-existent corsMiddleware
- Use `cookie-parser` for cookie parsing
- Fix database health check to use `getDb()` function

### 3. Add Missing Dependencies to package.json

Add to dependencies:
```json
"cookie-parser": "^1.4.7",
"cors": "^2.8.5",
"express-rate-limit": "^7.5.0",
"pino": "^9.6.0"
```

Add to devDependencies:
```json
"@types/cookie-parser": "^1.4.8",
"@types/cors": "^2.8.17"
```

## Verification

```bash
pnpm install
pnpm run check 2>&1 | head -20
```
