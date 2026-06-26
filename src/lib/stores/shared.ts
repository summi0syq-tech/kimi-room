// Shared pure helpers for the server-persistence reference adapters
// (supabase-adapter, prisma-adapter). Mirrors idb-adapter semantics EXACTLY so
// the three adapters are behaviorally interchangeable, and their export/import
// JSON is the same shape as idb's (Record<StoreName, Entry[]>) — meaning you can
// migrate idb ⇄ supabase ⇄ prisma by exporting from one and importing into
// another. See docs/SELF-HOST.md.
//
// Storage model: every collection is one uniform row
//   { id, collection, createdAt, updatedAt, data }
// where `data` is the entry minus its envelope fields (id/createdAt/updatedAt).
// A single table holds all 11 collections + blob, keyed by `collection`. This
// keeps each backend's schema to ONE table and makes adding a field a no-op (it
// lands in the jsonb `data`, no migration). 1v1 / small data: list/search/filter
// run client-side over the collection's rows, identical to idb-adapter.

import type { BlobEntry, Filter, StoreEntry } from "./types";

// The 11 structured collections (everything except binary blobs).
export const COLLECTIONS = [
  "keepsake",
  "piece",
  "book",
  "concept",
  "memo",
  "calendar",
  "memory",
  "chat",
  "track",
  "activeState",
  "sleep",
] as const;

export const BLOB_COLLECTION = "blob" as const;

// Uniform persisted row — one table, all collections.
export type StoreRow = {
  id: string;
  collection: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

// ── Filter / search — copied verbatim from idb-adapter so behaviour matches.
export function applyFilter<T extends StoreEntry>(rows: T[], filter?: Filter): T[] {
  if (!filter) return rows;
  let out = rows;
  if (filter.ids) out = out.filter((r) => filter.ids!.includes(r.id));
  if (filter.tags) {
    out = out.filter((r) => {
      const t = (r as { tags?: string[] }).tags;
      return Array.isArray(t) && filter.tags!.some((tag) => t.includes(tag));
    });
  }
  if (filter.status) {
    out = out.filter((r) => (r as { status?: string }).status === filter.status);
  }
  if (filter.activeOnly) {
    out = out.filter((r) => (r as { active?: boolean }).active !== false);
  }
  if (filter.dateRange) {
    out = out.filter((r) => {
      const d = (r as { date?: string }).date ?? r.createdAt;
      return d >= filter.dateRange!.from && d <= filter.dateRange!.to;
    });
  }
  if (filter.limit) out = out.slice(0, filter.limit);
  return out;
}

export function searchRows<T extends StoreEntry>(rows: T[], query: string): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
}

// ── put upsert/timestamp semantics — identical to idb-adapter's makeStore.put.
export function mergeEntry<T extends StoreEntry>(
  existing: T | null,
  patch: Partial<T> & { id?: string },
  now: string,
): T {
  const id = patch.id ?? existing?.id ?? newId();
  return {
    ...(existing ?? {}),
    ...patch,
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } as T;
}

// ── entry ⇄ row conversion (envelope split out; rest goes to jsonb `data`).
export function entryToRow(collection: string, entry: StoreEntry): StoreRow {
  const { id, createdAt, updatedAt, ...rest } = entry as StoreEntry &
    Record<string, unknown>;
  return { id, collection, createdAt, updatedAt, data: rest };
}

export function rowToEntry<T extends StoreEntry>(row: StoreRow): T {
  return {
    ...row.data,
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as T;
}

// Blobs have no updatedAt; we mirror createdAt into the row's updated_at column
// and drop it on the way back out.
export function blobToRow(blob: BlobEntry): StoreRow {
  const { id, createdAt, ...rest } = blob;
  return {
    id,
    collection: BLOB_COLLECTION,
    createdAt,
    updatedAt: createdAt,
    data: rest as Record<string, unknown>,
  };
}

export function rowToBlob(row: StoreRow): BlobEntry {
  return {
    id: row.id,
    createdAt: row.createdAt,
    ...(row.data as Omit<BlobEntry, "id" | "createdAt">),
  };
}

// ── export/import — same JSON shape as idb (Record<collection, rows[]>).
export function rowsToExport(rows: StoreRow[]): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const c of [...COLLECTIONS, BLOB_COLLECTION]) out[c] = [];
  for (const row of rows) {
    (out[row.collection] ??= []).push(
      row.collection === BLOB_COLLECTION ? rowToBlob(row) : rowToEntry(row),
    );
  }
  return out;
}

export function importToRows(payload: Record<string, unknown[]>): StoreRow[] {
  const rows: StoreRow[] = [];
  for (const c of [...COLLECTIONS, BLOB_COLLECTION]) {
    const arr = payload[c];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item || typeof item !== "object" || !("id" in item)) continue;
      rows.push(
        c === BLOB_COLLECTION
          ? blobToRow(item as BlobEntry)
          : entryToRow(c, item as StoreEntry),
      );
    }
  }
  return rows;
}
