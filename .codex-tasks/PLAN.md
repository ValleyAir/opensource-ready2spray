# Ready2Spray Rebuild - Master Plan

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind + Radix UI (shadcn)
- **Backend:** Express + tRPC + Drizzle ORM
- **Database:** PostgreSQL (direct via `postgres` library - NO Supabase)
- **Auth:** Email/password with bcrypt + JWT sessions (jose library)
- **Maps:** Google Maps API
- **AI:** Ollama (local, default) with Anthropic Claude fallback
- **Routing:** Wouter
- **Toasts:** Sonner

## Data Model (Customer-Centric)
```
Customer
  └── Properties (address OR GPS coordinates)
        ├── Polygon boundaries (GeoJSON, KML export)
        └── Jobs
              └── Products (EPA-registered, pulled from Agrian)
```

## Phases (execute in order)
1. `phase-1-demo-mode.md` - Bypass Stripe billing, unlock all features
2. `phase-2-auth-replace.md` - Replace OAuth with email/password + JWT
3. `phase-3-org-simplify.md` - Single-org per user, rename Sites→Properties
4. `phase-4-db-cleanup.md` - Remove all Supabase references
5. `phase-5-dead-code.md` - Delete Stripe, integrations, Mailgun, S3, team files
6. `phase-6-property-maps.md` - KML generation, polygon overlays, job history on map
7. `phase-7-ai-config.md` - Ollama default with Claude fallback

## Key Rules
- After each phase, run `npm run build` to verify no errors
- DO NOT modify: `server/agrian.ts`, `server/epaLabelParser.ts`, product features
- Keep `openId` field on users table (set to UUID) - too many FK references to change
- Keep `organizations` table with auto-create per user - FK dependencies everywhere
- Keep dead schema tables (avoid complex migrations) - just remove the code that uses them
