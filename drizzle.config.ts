import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL;

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: url ? { url } : undefined,
  verbose: true,
  strict: true,
} satisfies Config;
