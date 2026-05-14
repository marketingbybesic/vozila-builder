import "server-only";
import type { DbAdapter } from "./types";
import { memoryAdapter } from "./memory-adapter";

// Single export — swap implementation by env var.
//   DB_DRIVER=supabase → real Postgres via Drizzle + postgres-js
//   else              → in-memory adapter (default, dev convenience, NOT persistent on serverless)
let _db: DbAdapter | null = null;

export function db(): DbAdapter {
  if (_db) return _db;
  if (process.env.DB_DRIVER === "supabase") {
    // Lazy require so the postgres-js client only instantiates when actually needed.
    // require() is fine here — this file is "server-only" and never bundled for the client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabaseAdapter } = require("./supabase-adapter") as typeof import("./supabase-adapter");
    _db = supabaseAdapter;
  } else {
    _db = memoryAdapter;
  }
  return _db;
}

export type { DbAdapter, DbUser, DbMessage, DbThread, ThreadWithLatest } from "./types";
