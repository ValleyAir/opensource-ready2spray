# Phase 4: Remove Supabase References + Clean DB Connection

## Goal
Ensure the database connection is PostgreSQL-only with no Supabase references anywhere in the codebase.

---

## Changes Required

### 1. `server/db.ts` - Clean connection logic
In the `getDatabaseUrl()` function (or wherever the DB connection string is constructed):

**Remove:**
- Any fallback to `SUPABASE_DATABASE_URL` environment variable
- Any fallback to `R2S_Supabase` password
- Any comments mentioning Supabase

**Keep:**
- `DATABASE_URL` as the primary connection method
- Fallback to component-based construction: `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

The connection should look like:
```typescript
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "postgres";
  const name = process.env.DB_NAME || "ready2spray";
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}
```

### 2. `server/_core/sdk.ts` - Remove Supabase comments
Search for any comments mentioning "Supabase" or "RLS" and remove them. Examples:
- "This bypasses the database entirely to avoid Supabase RLS issues"
- "Ignore upsert errors in dev mode (Supabase RLS issues)"

### 3. Delete `test-query.mjs`
If this file exists in the project root, delete it. It's a legacy Supabase connection test.

### 4. Create/update `.env.example`
Document all required and optional environment variables:
```env
# Database (required)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ready2spray

# Or use individual components:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_NAME=ready2spray

# Auth (required)
COOKIE_SECRET=your-secret-key-min-32-chars
APP_ID=ready2spray

# Dev mode
NODE_ENV=development
VITE_DEV_AUTH=true
OWNER_OPEN_ID=local-admin-001
OWNER_NAME=Local Admin
OWNER_EMAIL=admin@localhost

# AI - Ollama (default, local)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# AI - Anthropic (fallback)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Optional
PORT=3000
```

---

## Verification
Run a grep to confirm no Supabase references remain:
```bash
grep -ri "supabase" server/ shared/ client/src/ --include="*.ts" --include="*.tsx" --include="*.js"
```
This should return zero results.

```bash
npm run build
```
- App connects to local PostgreSQL via `DATABASE_URL`
- All queries work correctly
