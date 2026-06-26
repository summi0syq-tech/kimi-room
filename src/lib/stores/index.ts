// V2 store entry-point · public hooks 6 module page 调.
//
// canon mode: 走 CanonPrismaAdapter (TODO Phase 3 · wrap existing prisma + lib/*-data.ts).
// V2 mode:    走 IndexedDBAdapter (default), 后续 settings 切 NotionAdapter / SupabaseAdapter.
//
// 现 Phase 2: IDB only. Phase 3 page rewrite 后 + Phase 5 community adapter PR.

import { isCanon } from "../kimi-mode";
import { coreAdapter } from "./core-adapter";
import { idbAdapter } from "./idb-adapter";
import { prismaAdapter } from "./prisma-adapter";
import { supabaseAdapter } from "./supabase-adapter";
import type { AdapterBundle } from "./types";

// NEXT_PUBLIC_KIMI_ADAPTER selects where dashboard data lives:
//   "idb" (default) — in-browser IndexedDB, zero config, no backend.
//   "supabase"      — server persistence, browser-direct + RLS (supabase-adapter).
//   "prisma"        — server persistence via /api/store over any Postgres.
//   "core"          — through a running kimi-core (same backend as memory/RAG).
// The server backends load their driver lazily, so selecting idb keeps them out of
// the runtime. canon prod wires its own adapter (Phase 3); unaffected here.
// See docs/SELF-HOST.md.
function selectAdapter(): AdapterBundle {
  if (isCanon) return idbAdapter;
  switch (process.env.NEXT_PUBLIC_KIMI_ADAPTER) {
    case "supabase":
      return supabaseAdapter;
    case "prisma":
      return prismaAdapter;
    case "core":
      return coreAdapter;
    default:
      return idbAdapter;
  }
}

let _bundle: AdapterBundle | null = null;
export function getAdapter(): AdapterBundle {
  if (!_bundle) _bundle = selectAdapter();
  return _bundle;
}

// Convenience hooks · page 调.
export const keepsakeStore = () => getAdapter().keepsake;
export const pieceStore = () => getAdapter().piece;
export const bookStore = () => getAdapter().book;
export const conceptStore = () => getAdapter().concept;
export const memoStore = () => getAdapter().memo;
export const calendarStore = () => getAdapter().calendar;
export const memoryStore = () => getAdapter().memory;
export const chatStore = () => getAdapter().chat;
export const trackStore = () => getAdapter().track;
export const activeStateStore = () => getAdapter().activeState;
export const sleepStore = () => getAdapter().sleep;
export const blobStore = () => getAdapter().blob;

export type {
  ActiveStateEntry,
  AdapterBundle,
  BlobEntry,
  BookEntry,
  CalendarEvent,
  ChatEntry,
  ConceptEntry,
  Filter,
  MemoEntry,
  MemoryEntry,
  PieceEntry,
  SleepEntry,
  StoreContract,
  StoreEntry,
  KeepsakeEntry,
  TrackEntry,
} from "./types";
