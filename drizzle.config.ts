import { defineConfig } from "drizzle-kit";

// Use DATABASE_URL from .env or fallback to local PostgreSQL
const connectionString = process.env.DATABASE_URL || "postgresql://gtm_dev:Claude_Code_Rules2026@localhost:5432/Ready2Spray";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
