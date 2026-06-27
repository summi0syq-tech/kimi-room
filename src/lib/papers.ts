// Paper digests for /room/study/papers. The data lives in kimi-core's paper_notes
// table (auto-filled by the paper extension's loop); the page reads it via the
// paper_list tool in core mode and falls back to the fictional DEMO_PAPERS below
// otherwise, so the page is beautiful out of the box.

import type { KimiTheme } from "./day-theme-client";

export type Paper = {
  id: string;
  externalId?: string | null;
  title: string;
  journal?: string | null;
  authors?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  knowledge: string;
  relevance?: string | null;
  axis?: string | null;
  hasFullText: boolean;
  importance: number;
  pinned: boolean;
  isActive?: boolean;
  createdAt: string;
};

export type MonthGroup = { key: string; label: string; papers: Paper[] };

// De-identified axis coloring: hash the free-text axis to a low-chroma "gem" hue
// (never gold — gem colours never outshine the gilt; see kimi-design). No fixed
// research families, so any field's axes get a stable, distinct colour.
const GEM_NIGHT = ["#a8737d", "#7d8a6a", "#9a8456", "#8a7a98", "#5f8a86"];
const GEM_DAY = ["#9a5560", "#5f6e4a", "#7a6230", "#6e5878", "#3f6e6a"];
export function axisColor(axis: string | null | undefined, theme: KimiTheme): string {
  const gems = theme === "night" ? GEM_NIGHT : GEM_DAY;
  const s = (axis ?? "").trim() || "·";
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return gems[h % gems.length];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y} · ${MONTHS[Number(m) - 1] ?? m}`;
}

export function groupPapers(all: Paper[]): { pinned: Paper[]; months: MonthGroup[]; archivedCount: number } {
  const active = all.filter((p) => p.isActive !== false);
  const archivedCount = all.length - active.length;
  const pinned = active.filter((p) => p.pinned);
  const rest = active.filter((p) => !p.pinned);
  const mMap = new Map<string, Paper[]>();
  for (const p of rest) {
    const k = p.createdAt.slice(0, 7);
    const arr = mMap.get(k);
    if (arr) arr.push(p);
    else mMap.set(k, [p]);
  }
  const months: MonthGroup[] = Array.from(mMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, papers]) => ({ key, label: monthLabel(key), papers }));
  return { pinned, months, archivedCount };
}

// Fictional, neutral demo seed — no real person or paper. Shown when not in core
// mode (or before the live fetch resolves). Dates are fixed for determinism.
export const DEMO_PAPERS: Paper[] = [
  {
    id: "demo-paper-1",
    title: "Sparse mixtures of experts scale without the compute",
    authors: "A. Rivera, K. Sato",
    journal: "Proc. of Learning Systems",
    url: null,
    publishedAt: "2026-06-18",
    knowledge: "Routing tokens to a few of many experts keeps quality while cutting active FLOPs; the gain holds as model width grows.",
    relevance: "A cheaper path to scale — relevant when inference cost matters more than peak accuracy.",
    axis: "ml",
    hasFullText: true,
    importance: 5,
    pinned: true,
    isActive: true,
    createdAt: "2026-06-20T09:00:00.000Z",
  },
  {
    id: "demo-paper-2",
    title: "A reproducible protocol for single-cell benchmark suites",
    authors: "M. Okafor, L. Bianchi",
    journal: "Methods in Biology",
    url: null,
    publishedAt: "2026-06-10",
    knowledge: "A fixed split plus a seed registry makes single-cell pipelines comparable across labs; the authors release a reference harness.",
    relevance: "Methodology you can borrow — the seed-registry idea generalises beyond single-cell.",
    axis: "methods",
    hasFullText: false,
    importance: 4,
    pinned: false,
    isActive: true,
    createdAt: "2026-06-12T09:00:00.000Z",
  },
  {
    id: "demo-paper-3",
    title: "Diffusion models as implicit priors for inverse problems",
    authors: "S. Lindqvist",
    journal: "Imaging & Inference",
    url: null,
    publishedAt: "2026-05-28",
    knowledge: "A pretrained diffusion model can act as a plug-in prior for deblurring and inpainting without task-specific retraining.",
    relevance: "Bridges generative models and classical inverse problems — a reusable trick.",
    axis: "ml",
    hasFullText: true,
    importance: 4,
    pinned: false,
    isActive: true,
    createdAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "demo-paper-4",
    title: "On the limits of long-context retrieval in language models",
    authors: "J. Park, R. Mendes",
    journal: "Computational Linguistics Letters",
    url: null,
    publishedAt: "2026-05-15",
    knowledge: "Recall degrades in the middle of very long contexts even when the tokens fit; position, not capacity, is the bottleneck.",
    relevance: "Tempers expectations for huge context windows — chunked retrieval still earns its keep.",
    axis: "theory",
    hasFullText: false,
    importance: 3,
    pinned: false,
    isActive: true,
    createdAt: "2026-05-16T09:00:00.000Z",
  },
];
