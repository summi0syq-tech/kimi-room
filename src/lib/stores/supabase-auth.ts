"use client";

// Minimal single-user auth for the Supabase adapter. RLS is the real gate (a row
// is invisible unless owner = auth.uid()); this just signs the one owner in so
// auth.uid() is populated for the session. Wire a tiny sign-in form to these
// helpers — the UI is intentionally left to you. See docs/SELF-HOST.md.

import { getSupabase } from "./supabase-client";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithOtp({ email });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const sb = await getSupabase();
  await sb.auth.signOut();
}

export async function currentUserEmail(): Promise<string | null> {
  const sb = await getSupabase();
  const { data } = await sb.auth.getUser();
  return data.user?.email ?? null;
}
