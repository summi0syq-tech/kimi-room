import { isCanon } from "../kimi-mode";
import { idbAdapter } from "./idb-adapter";
import type { AdapterBundle } from "./types";

function selectAdapter(): AdapterBundle {
  if (isCanon) {
    return idbAdapter;
  }
  return idbAdapter;
}

let _bundle: AdapterBundle | null = null;
export function getAdapter(): AdapterBundle {
  if (!_bundle) _bundle = selectAdapter();
  return _bundle;
}

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
