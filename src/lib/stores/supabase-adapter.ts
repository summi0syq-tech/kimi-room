// SupabaseAdapter · server persistence over a single `store_rows` table, read
// straight from the browser with the project's ANON key (Row-Level Security
// scopes every row to the signed-in user — see supabase/schema.sql). Behaviour
// mirrors idb-adapter exactly (same filter/search/upsert semantics, same
// export/import JSON shape), so idb ⇄ supabase migration is just export→import.
//
// Opt in with NEXT_PUBLIC_KIMI_ADAPTER=supabase. See docs/SELF-HOST.md.

import {
  applyFilter,
  blobToRow,
  entryToRow,
  importToRows,
  mergeEntry,
  newId,
  nowISO,
  rowToBlob,
  rowToEntry,
  rowsToExport,
  searchRows,
  type StoreRow,
} from "./shared";
import {
  getSupabase,
  STORE_COLS,
  STORE_TABLE,
  type SbRow,
} from "./supabase-client";
import type {
  ActiveStateEntry,
  AdapterBundle,
  BlobContract,
  BlobEntry,
  BookEntry,
  CalendarEvent,
  ChatEntry,
  ConceptEntry,
  KeepsakeEntry,
  MemoEntry,
  MemoryEntry,
  PieceEntry,
  SleepEntry,
  StoreContract,
  StoreEntry,
  TrackEntry,
} from "./types";

function fromSb(r: SbRow): StoreRow {
  return {
    id: r.id,
    collection: r.collection,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    data: r.data ?? {},
  };
}

function toSb(row: StoreRow): SbRow {
  return {
    id: row.id,
    collection: row.collection,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    data: row.data,
  };
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`supabase: ${res.error.message}`);
  return (res.data ?? []) as unknown as T;
}

// All rows of one collection (owner-scoped by RLS).
async function rowsOf(collection: string): Promise<StoreRow[]> {
  const sb = await getSupabase();
  const res = await sb.from(STORE_TABLE).select(STORE_COLS).eq("collection", collection);
  return unwrap<SbRow[]>(res).map(fromSb);
}

async function sbGetOne<T extends StoreEntry>(
  collection: string,
  id: string,
): Promise<T | null> {
  const sb = await getSupabase();
  const res = await sb
    .from(STORE_TABLE)
    .select(STORE_COLS)
    .eq("collection", collection)
    .eq("id", id);
  const row = unwrap<SbRow[]>(res)[0];
  return row ? rowToEntry<T>(fromSb(row)) : null;
}

function makeStore<T extends StoreEntry>(collection: string): StoreContract<T> {
  return {
    async list(filter) {
      const entries = (await rowsOf(collection)).map((r) => rowToEntry<T>(r));
      return applyFilter(entries, filter);
    },
    async get(id) {
      return sbGetOne<T>(collection, id);
    },
    async put(entry) {
      const existing = entry.id ? await sbGetOne<T>(collection, entry.id) : null;
      const merged = mergeEntry<T>(existing, entry, nowISO());
      const sb = await getSupabase();
      unwrap(await sb.from(STORE_TABLE).upsert(toSb(entryToRow(collection, merged))));
      return merged;
    },
    async delete(id) {
      const sb = await getSupabase();
      unwrap(
        await sb.from(STORE_TABLE).delete().eq("collection", collection).eq("id", id),
      );
    },
    async search(query) {
      const entries = (await rowsOf(collection)).map((r) => rowToEntry<T>(r));
      return searchRows(entries, query);
    },
  };
}

const blobContract: BlobContract = {
  async list(kind) {
    const sb = await getSupabase();
    const res = await sb.from(STORE_TABLE).select(STORE_COLS).eq("collection", "blob");
    const blobs = unwrap<SbRow[]>(res).map((r) => rowToBlob(fromSb(r)));
    return kind ? blobs.filter((b) => b.kind === kind) : blobs;
  },
  async get(id) {
    const sb = await getSupabase();
    const res = await sb
      .from(STORE_TABLE)
      .select(STORE_COLS)
      .eq("collection", "blob")
      .eq("id", id);
    const row = unwrap<SbRow[]>(res)[0];
    return row ? rowToBlob(fromSb(row)) : null;
  },
  async put(blob) {
    const full: BlobEntry = {
      id: blob.id ?? newId(),
      kind: blob.kind,
      contentType: blob.contentType,
      base64: blob.base64,
      createdAt: nowISO(),
    };
    const sb = await getSupabase();
    unwrap(await sb.from(STORE_TABLE).upsert(toSb(blobToRow(full))));
    return full;
  },
  async delete(id) {
    const sb = await getSupabase();
    unwrap(await sb.from(STORE_TABLE).delete().eq("collection", "blob").eq("id", id));
  },
};

export const supabaseAdapter: AdapterBundle = {
  keepsake: makeStore<KeepsakeEntry>("keepsake"),
  piece: makeStore<PieceEntry>("piece"),
  book: makeStore<BookEntry>("book"),
  concept: makeStore<ConceptEntry>("concept"),
  memo: makeStore<MemoEntry>("memo"),
  calendar: makeStore<CalendarEvent>("calendar"),
  memory: makeStore<MemoryEntry>("memory"),
  chat: makeStore<ChatEntry>("chat"),
  track: makeStore<TrackEntry>("track"),
  activeState: makeStore<ActiveStateEntry>("activeState"),
  sleep: makeStore<SleepEntry>("sleep"),
  blob: blobContract,

  async exportJSON() {
    const sb = await getSupabase();
    const res = await sb.from(STORE_TABLE).select(STORE_COLS);
    const rows = unwrap<SbRow[]>(res).map(fromSb);
    return JSON.stringify(rowsToExport(rows), null, 2);
  },

  async importJSON(json) {
    const rows = importToRows(JSON.parse(json) as Record<string, unknown[]>);
    if (rows.length) {
      const sb = await getSupabase();
      unwrap(await sb.from(STORE_TABLE).upsert(rows.map(toSb)));
    }
    return { added: rows.length };
  },

  async empty() {
    const sb = await getSupabase();
    // delete() needs a filter; every real id is non-empty, so neq("") matches all
    // (RLS still scopes this to the signed-in owner).
    unwrap(await sb.from(STORE_TABLE).delete().neq("id", ""));
  },
};
