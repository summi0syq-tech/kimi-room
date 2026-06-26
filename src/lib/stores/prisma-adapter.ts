// PrismaAdapter (browser side) · a thin fetch client over /api/store. All real
// DB work runs server-side in that route (Prisma over any Postgres); this file
// imports no Prisma and holds no DATABASE_URL — it just forwards typed calls with
// the owner session cookie. The route uses the same shared helpers as idb, so
// behaviour matches. Opt in with NEXT_PUBLIC_KIMI_ADAPTER=prisma. See docs/SELF-HOST.md.

import type {
  ActiveStateEntry,
  AdapterBundle,
  BlobContract,
  BlobEntry,
  BookEntry,
  CalendarEvent,
  ChatEntry,
  ConceptEntry,
  Filter,
  KeepsakeEntry,
  MemoEntry,
  MemoryEntry,
  PieceEntry,
  SleepEntry,
  StoreContract,
  StoreEntry,
  TrackEntry,
} from "./types";

async function call<T>(
  op: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch("/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ op, ...payload }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `store op ${op} failed (${res.status})`);
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

function makeStore<T extends StoreEntry>(collection: string): StoreContract<T> {
  return {
    list: (filter?: Filter) => call<T[]>("list", { collection, filter }),
    get: (id: string) => call<T | null>("get", { collection, id }),
    put: (entry: Partial<T> & { id?: string }) =>
      call<T>("put", { collection, entry }),
    delete: async (id: string) => {
      await call("delete", { collection, id });
    },
    search: (query: string) => call<T[]>("search", { collection, query }),
  };
}

const blobContract: BlobContract = {
  list: (kind?: BlobEntry["kind"]) => call<BlobEntry[]>("blobList", { kind }),
  get: (id: string) => call<BlobEntry | null>("blobGet", { id }),
  put: (blob) => call<BlobEntry>("blobPut", { blob }),
  delete: async (id: string) => {
    await call("blobDelete", { id });
  },
};

export const prismaAdapter: AdapterBundle = {
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

  exportJSON: () => call<string>("export"),
  importJSON: (json: string) => call<{ added: number }>("import", { json }),
  empty: async () => {
    await call("empty");
  },
};
