import "server-only";
import type { DbAdapter } from "./types";
import { memoryAdapter } from "./memory-adapter";

// Single export — swap implementation by env var when Supabase project exists.
// process.env.DB_DRIVER === "supabase" → real Supabase adapter (TODO when keys exist)
// otherwise → in-memory adapter (current default)
let _db: DbAdapter | null = null;

export function db(): DbAdapter {
  if (_db) return _db;
  // Future: if (process.env.DB_DRIVER === "supabase") _db = await import("./supabase-adapter").then(m => m.supabaseAdapter);
  _db = memoryAdapter;
  return _db;
}

export type { DbAdapter, DbUser, DbMessage, DbThread, ThreadWithLatest } from "./types";
