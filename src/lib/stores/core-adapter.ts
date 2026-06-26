// CoreAdapter (Tier 2) · dashboard persistence through a running kimi-core.
//
// When NEXT_PUBLIC_KIMI_ADAPTER=core, the room's structured data (calendar /
// sleep / keepsakes / …) is stored in kimi-core's `store` extension instead of a
// local DB — so a deployment that already runs kimi-core for memory (RAG) uses
// THE SAME backend for the dashboard. Every op is forwarded through the existing
// /api/core MCP redirect (server holds the key; browser never sees it) by calling
// the core `store` tool, which returns the result as JSON in a text block. The
// behaviour matches idb / supabase / prisma — kimi-core runs the same shared
// helpers server-side. See docs/SELF-HOST.md.
//
// Requires the same env as core memory mode: KIMI_CORE_URL + KIMI_API_KEY (the
// /api/core route reads them) and the `store` extension enabled on kimi-core
// (KIMI_EXTENSIONS=store).

import { callCoreTool } from "../kimi-core-client";
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

// Call the core `store` tool and parse its JSON result. The tool returns the bare
// result encoded as JSON in a text block; export returns a JSON string (so this
// returns that string verbatim). Errors come back as { error } — surfaced as throw.
async function call<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const text = await callCoreTool("store", { op, ...payload });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`core store ${op}: invalid response`);
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "error" in parsed) {
    throw new Error(String((parsed as { error: unknown }).error));
  }
  return parsed as T;
}

function makeStore<T extends StoreEntry>(collection: string): StoreContract<T> {
  return {
    list: (filter?: Filter) => call<T[]>("list", { collection, filter }),
    get: (id: string) => call<T | null>("get", { collection, id }),
    put: (entry: Partial<T> & { id?: string }) => call<T>("put", { collection, entry }),
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

export const coreAdapter: AdapterBundle = {
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
