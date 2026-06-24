// SupabaseAdapter
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  ActiveStateEntry, AdapterBundle, BlobContract, BlobEntry,
  BookEntry, CalendarEvent, ChatEntry, ConceptEntry, Filter,
  KeepsakeEntry, MemoEntry, MemoryEntry, PieceEntry, SleepEntry,
  StoreContract, StoreEntry, TrackEntry,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase env missing");
    }
    _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _client;
}

function applyFilter<T extends StoreEntry>(rows: T[], filter?: Filter): T[] {
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
      const d = (r as { date?: string }).date ?? (r as { created_at?: string }).created_at;
      if (!d) return false;
      return d >= filter.dateRange!.from && d <= filter.dateRange!.to;
    });
  }
  if (filter.limit) out = out.slice(0, filter.limit);
  return out;
}

function makeStore<T extends StoreEntry>(tableName: string): StoreContract<T> {
  return {
    async list(filter) {
      const { data, error } = await getClient()
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return applyFilter(data ?? [], filter);
    },
    async get(id) {
      const { data, error } = await getClient()
        .from(tableName)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    async put(entry) {
      const now = new Date().toISOString();
      const id = entry.id ?? crypto.randomUUID();
      const { data: existing } = entry.id
        ? await getClient().from(tableName).select("*").eq("id", entry.id).single()
        : { data: null };
      const full = {
        ...(existing ?? {}),
        ...entry,
        id,
        created_at: (existing as { created_at?: string })?.created_at ?? now,
        updated_at: now,
      } as T;
      const { error } = await getClient().from(tableName).upsert(full);
      if (error) throw error;
      return full;
    },
    async delete(id) {
      const { error } = await getClient().from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    async search(query) {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const { data, error } = await getClient().from(tableName).select("*");
      if (error) throw error;
      return (data ?? []).filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q)
      );
    },
  };
}

const blobContract: BlobContract = {
  async list(kind) {
    const { data, error } = await getClient().from("blob").select("*");
    if (error) throw error;
    return kind ? (data ?? []).filter((r) => r.kind === kind) : data ?? [];
  },
  async get(id) {
    const { data, error } = await getClient().from("blob").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  async put(blob) {
    const id = blob.id ?? crypto.randomUUID();
    const full: BlobEntry = {
      id,
      kind: blob.kind,
      contentType: blob.contentType,
      base64: blob.base64,
      created_at: new Date().toISOString(),
    };
    const { error } = await getClient().from("blob").upsert(full);
    if (error) throw error;
    return full;
  },
  async delete(id) {
    const { error } = await getClient().from("blob").delete().eq("id", id);
    if (error) throw error;
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
  activeState: makeStore<ActiveStateEntry>("active_state"),
  sleep: makeStore<SleepEntry>("sleep"),
  blob: blobContract,

  async exportJSON() {
    const all: Record<string, unknown[]> = {};
    const tables = ["keepsake","piece","book","concept","memo","calendar","memory","chat","track","active_state","sleep","blob"];
    for (const t of tables) {
      const { data } = await getClient().from(t).select("*");
      all[t] = data ?? [];
    }
    return JSON.stringify(all, null, 2);
  },

  async importJSON(json) {
    const parsed = JSON.parse(json) as Record<string, unknown[]>;
    let added = 0;
    for (const [table, rows] of Object.entries(parsed)) {
      if (!rows.length) continue;
      const { error } = await getClient().from(table).upsert(rows);
      if (error) throw error;
      added += rows.length;
    }
    return { added };
  },

  async empty() {
    const tables = ["keepsake","piece","book","concept","memo","calendar","memory","chat","track","active_state","sleep","blob"];
    for (const t of tables) {
      await getClient().from(t).delete().neq("id", "dummy");
    }
  },
};
