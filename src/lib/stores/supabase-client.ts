// Lazy Supabase client + the minimal typed surface the adapter/auth use.
//
// The client is created on first use via a dynamic import, so @supabase/supabase-js
// lands in an async chunk — a deployment that never selects the supabase adapter
// never loads it at runtime. We model only the few calls we make (a narrow
// structural type) and cast the real client through `unknown`, so this file does
// not depend on the package's full generated types. See docs/SELF-HOST.md.

export type SbRow = {
  id: string;
  collection: string;
  created_at: string;
  updated_at: string;
  data: Record<string, unknown>;
};

export interface SbResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// One loose chainable/thenable builder covers from()/select()/eq()/neq()/upsert()/delete().
export interface SbBuilder<T> extends PromiseLike<SbResponse<T>> {
  select(columns?: string): SbBuilder<T>;
  eq(column: string, value: unknown): SbBuilder<T>;
  neq(column: string, value: unknown): SbBuilder<T>;
  upsert(values: SbRow | SbRow[]): SbBuilder<T>;
  delete(): SbBuilder<T>;
}

export interface SbAuth {
  signInWithPassword(creds: {
    email: string;
    password: string;
  }): Promise<SbResponse<unknown>>;
  signInWithOtp(creds: { email: string }): Promise<SbResponse<unknown>>;
  signOut(): Promise<{ error: { message: string } | null }>;
  getUser(): Promise<{
    data: { user: { id: string; email?: string | null } | null };
    error: { message: string } | null;
  }>;
}

export interface SbClient {
  from(table: string): SbBuilder<SbRow[]>;
  auth: SbAuth;
}

export const STORE_TABLE = "store_rows";
export const STORE_COLS = "id, collection, created_at, updated_at, data";

let _client: SbClient | null = null;

export async function getSupabase(): Promise<SbClient> {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "supabase adapter: set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (see docs/SELF-HOST.md)",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(url, key) as unknown as SbClient;
  return _client;
}
