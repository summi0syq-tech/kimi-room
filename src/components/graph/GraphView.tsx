"use client";

import { useMemo, useState } from "react";
import { KimiTopNav } from "@/components/mucha/KimiPage";
import type { GOTHIC } from "@/lib/kimi-palettes";
import type { GraphData, GraphNode, GraphNodeKind } from "@/lib/graph-data";
import { SCORE_FONT_BODY, VALENCE_COLORS, valenceColor } from "@/lib/score-colors";

// /room/graph — the knowledge graph as a concentric-ring star chart, echoing the
// (deprecated) CelestialMap's same-center rings. 4 node kinds each live on their
// own ring; angular position is a deterministic hash of the id so the layout is
// stable across reloads. Edges are coloured by relationType. The dream layer
// lights up the memories last night's dream surfaced + the edges it walked, so
// the static KG and the dream activity read apart at a glance.

const W = 360;
const SVG_H = 540;
const CX = W / 2;
const CY = 250;

// Concentric rings, inner→outer. topic = organizing core, entity = people ring,
// memory = the broad belt, observation = outer notes. Radii tuned so rings don't
// collide and the memory belt (the densest) gets the widest band.
const RING: Record<GraphNodeKind, { r0: number; r1: number }> = {
  topic: { r0: 28, r1: 70 },
  entity: { r0: 84, r1: 128 },
  memory: { r0: 138, r1: 212 },
  observation: { r0: 222, r1: 244 },
};

// relationType → edge colour. Reuse score-colors valence palette so the page
// shares the rose-gothic token set (no new palette).
const EDGE_COLOR: Record<string, string> = {
  similar: VALENCE_COLORS.calm, // sage — memory↔memory semantic neighbours
  mentions: VALENCE_COLORS.warmth, // bronze — entity→memory
  tagged: VALENCE_COLORS.brooding, // cobalt — topic→memory
  co_mentioned: VALENCE_COLORS.towardHer, // rose — entity↔entity
};
function edgeColor(rt: string): string {
  return EDGE_COLOR[rt] ?? VALENCE_COLORS.calm;
}

// Deterministic 0..1 pair from an id (same hash family as SkyView.hashPos).
function hash01(id: string): { a: number; b: number } {
  let hx = 5381;
  let hy = 7919;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    hx = ((hx << 5) + hx + c) | 0;
    hy = ((hy << 5) + hy + c * 17 + 31) | 0;
  }
  return { a: (Math.abs(hx) % 10000) / 10000, b: (Math.abs(hy) % 10000) / 10000 };
}

type Pos = { x: number; y: number; r: number };

// Place each node on its kind-ring: angle from hash, radius jittered within the
// ring band by the second hash value. r = node draw-radius from weight.
function placeNodes(nodes: GraphNode[]): Map<string, Pos> {
  const map = new Map<string, Pos>();
  // index within kind → spread angles evenly + hash jitter so same-kind nodes
  // don't clump (pure-hash angles cluster on small sets).
  const kindIdx: Record<string, number> = {};
  const kindCount: Record<string, number> = {};
  for (const n of nodes) kindCount[n.kind] = (kindCount[n.kind] ?? 0) + 1;

  for (const n of nodes) {
    const { a, b } = hash01(n.id);
    const i = kindIdx[n.kind] ?? 0;
    kindIdx[n.kind] = i + 1;
    const total = Math.max(1, kindCount[n.kind]);
    // even base angle + hash jitter (±half a slot) → deterministic, well spread.
    const slot = (2 * Math.PI) / total;
    const angle = i * slot + (a - 0.5) * slot * 0.85;
    const band = RING[n.kind];
    const radius = band.r0 + b * (band.r1 - band.r0);
    const x = CX + Math.cos(angle) * radius;
    const y = CY + Math.sin(angle) * radius;
    const r = 1.6 + n.weight * 3.4;
    map.set(n.id, { x, y, r });
  }
  return map;
}

export function GraphView({ G, data }: { G: typeof GOTHIC; data: GraphData }) {
  const { nodes, edges, dream, counts } = data;
  const [selected, setSelected] = useState<string | null>(null);

  const pos = useMemo(() => placeNodes(nodes), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // dream id sets + the edges the dream actually walked (a `similar` edge whose
  // from is a surfaced memory and whose to is a linked memory — matches the
  // forward, undirected:false walk semantics of autonomous-loop.ts).
  const dreamSurfaced = useMemo(() => new Set(dream?.surfacedIds ?? []), [dream]);
  const dreamLinked = useMemo(() => new Set(dream?.linkedIds ?? []), [dream]);
  const dreamWalkedEdges = useMemo(() => {
    if (!dream) return [];
    return edges.filter(
      (e) =>
        e.relationType === "similar" &&
        ((dreamSurfaced.has(e.fromId) && dreamLinked.has(e.toId)) ||
          (dreamSurfaced.has(e.toId) && dreamLinked.has(e.fromId))),
    );
  }, [dream, edges, dreamSurfaced, dreamLinked]);
  const dreamActive = dreamSurfaced.size > 0 || dreamLinked.size > 0;

  // bg stars (deterministic, same idiom as SkyView).
  const bgStars = useMemo(
    () =>
      Array.from({ length: 140 }, (_, k) => ({
        x: ((k * 173 + 19) % (W - 12)) + 6,
        y: ((k * 211 + 31) % (SVG_H - 20)) + 10,
        r: 0.25 + (k % 4) * 0.1,
        o: 0.07 + (k % 5) * 0.022,
        delay: (k * 0.17) % 6,
      })),
    [],
  );

  const selectedNode = selected ? nodeById.get(selected) ?? null : null;

  return (
    <>
      <KimiTopNav title="HEARTBEAT" sub="graph · 图谱" P={G} icon="✦" iconColor={G.rose1} backHref="/room/heartbeat" />

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <div
          style={{
            fontSize: 42,
            color: G.ink,
            letterSpacing: "-0.01em",
            fontFamily: SCORE_FONT_BODY,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          constellation
        </div>
        <div
          style={{
            marginTop: 6,
            color: G.mute,
            fontSize: 10,
            letterSpacing: 3,
            fontFamily: SCORE_FONT_BODY,
            fontStyle: "italic",
          }}
        >
          {counts.memory} mem · {counts.entity} ent · {counts.topic} topic · {counts.observation} obs ·{" "}
          {counts.edges} edges
        </div>
      </div>

      {/* dream banner — what last night's dream touched */}
      {dreamActive && (
        <div
          style={{
            margin: "12px 16px 0",
            padding: "8px 12px",
            border: `0.5px solid ${G.rose1}`,
            borderRadius: 6,
            background: G.softAccent,
            fontFamily: SCORE_FONT_BODY,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: G.rose1,
              fontStyle: "italic",
            }}
          >
            ✦ DREAM · {dream?.wakeAt ? dream.wakeAt.slice(0, 16).replace("T", " ") : "—"}
          </div>
          <div style={{ fontSize: 10, color: G.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
            浮现 {dreamSurfaced.size} · 沿边走 {dreamLinked.size} · 走过 {dreamWalkedEdges.length} 条边
          </div>
        </div>
      )}

      <div style={{ padding: "0 12px", marginTop: 10 }}>
        {nodes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: G.mute,
              fontStyle: "italic",
              fontSize: 12,
            }}
          >
            — 图谱里还没有节点。
          </div>
        ) : (
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${SVG_H}`}
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              <radialGradient id="dreamHalo" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={G.rose1} stopOpacity="0.65" />
                <stop offset="0.5" stopColor={G.rose1} stopOpacity="0.18" />
                <stop offset="1" stopColor={G.rose1} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dreamLinkHalo" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={VALENCE_COLORS.warmth} stopOpacity="0.55" />
                <stop offset="0.5" stopColor={VALENCE_COLORS.warmth} stopOpacity="0.14" />
                <stop offset="1" stopColor={VALENCE_COLORS.warmth} stopOpacity="0" />
              </radialGradient>
              <style>{`
                @keyframes graphTwinkle {
                  0%, 100% { opacity: var(--o, 0.4); }
                  50% { opacity: calc(var(--o, 0.4) * 0.45); }
                }
                @keyframes dreamFlow {
                  to { stroke-dashoffset: -12; }
                }
                @keyframes dreamGlowPulse {
                  0%, 100% { opacity: 0.85; }
                  50% { opacity: 0.4; }
                }
              `}</style>
            </defs>

            {/* faint ring guides — concentric reference, echoes CelestialMap */}
            {(["topic", "entity", "memory", "observation"] as GraphNodeKind[]).map((k) => {
              const mid = (RING[k].r0 + RING[k].r1) / 2;
              return (
                <circle
                  key={`ring-${k}`}
                  cx={CX}
                  cy={CY}
                  r={mid}
                  fill="none"
                  stroke={G.hair}
                  strokeWidth="0.35"
                  opacity="0.4"
                />
              );
            })}

            {/* bg stars */}
            {bgStars.map((s, i) => (
              <circle
                key={`bg-${i}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill={G.ink}
                opacity={s.o}
                style={{
                  ["--o" as never]: s.o,
                  animation: `graphTwinkle ${4 + (i % 4)}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}

            {/* static edges (drawn first, under nodes) */}
            {edges.map((e, i) => {
              const a = pos.get(e.fromId);
              const b = pos.get(e.toId);
              if (!a || !b) return null;
              const c = edgeColor(e.relationType);
              return (
                <line
                  key={`edge-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={c}
                  strokeWidth="0.45"
                  opacity={Math.min(0.5, e.confidence * 0.5)}
                />
              );
            })}

            {/* DREAM walked edges — bright animated flow on top of static edges */}
            {dreamWalkedEdges.map((e, i) => {
              const a = pos.get(e.fromId);
              const b = pos.get(e.toId);
              if (!a || !b) return null;
              return (
                <line
                  key={`dream-edge-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={G.rose1}
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  opacity="0.92"
                  style={{ animation: "dreamFlow 0.9s linear infinite" }}
                />
              );
            })}

            {/* DREAM halos behind their nodes */}
            {nodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const isSurfaced = dreamSurfaced.has(n.id);
              const isLinked = dreamLinked.has(n.id);
              if (!isSurfaced && !isLinked) return null;
              return (
                <circle
                  key={`dh-${n.id}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r + 16}
                  fill={isSurfaced ? "url(#dreamHalo)" : "url(#dreamLinkHalo)"}
                  style={{ animation: "dreamGlowPulse 2.4s ease-in-out infinite" }}
                />
              );
            })}

            {/* nodes — shape per kind */}
            {nodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const isSel = selected === n.id;
              const isSurfaced = dreamSurfaced.has(n.id);
              const isLinked = dreamLinked.has(n.id);
              const dreamRing = isSurfaced ? G.rose1 : isLinked ? VALENCE_COLORS.warmth : null;
              return (
                <g
                  key={n.id}
                  onClick={() => setSelected(n.id)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  aria-label={`${n.kind} ${n.label}`}
                >
                  {/* fat invisible hit target */}
                  <circle cx={p.x} cy={p.y} r={p.r + 9} fill="transparent" />
                  <NodeGlyph node={n} p={p} G={G} />
                  {dreamRing && (
                    <NodeGlyphRing node={n} p={p} color={dreamRing} />
                  )}
                  {isSel && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={p.r + 6}
                      fill="none"
                      stroke={G.rose1}
                      strokeWidth="0.7"
                      opacity="0.85"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* legend */}
      <Legend G={G} />

      {selectedNode && (
        <NodeCard
          G={G}
          node={selectedNode}
          isDreamSurfaced={dreamSurfaced.has(selectedNode.id)}
          isDreamLinked={dreamLinked.has(selectedNode.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// kind → fill colour for node glyphs.
function nodeFill(node: GraphNode, G: typeof GOTHIC): string {
  switch (node.kind) {
    case "memory":
      return valenceColor(node.valence); // valence-tinted, like SkyView stars
    case "entity":
      return G.accent; // gold/rose accent
    case "topic":
      return VALENCE_COLORS.brooding; // cobalt
    case "observation":
      return G.inkSoft;
  }
}

// Per-kind glyph: memory=filled circle, entity=diamond, topic=hollow ring,
// observation=small dot.
function NodeGlyph({ node, p, G }: { node: GraphNode; p: Pos; G: typeof GOTHIC }) {
  const c = nodeFill(node, G);
  const r = p.r;
  if (node.kind === "memory") {
    return (
      <>
        <circle cx={p.x} cy={p.y} r={r + 2.5} fill={c} opacity="0.18" />
        <circle cx={p.x} cy={p.y} r={r} fill={c} />
      </>
    );
  }
  if (node.kind === "entity") {
    const d = r + 1.4;
    return (
      <polygon
        points={`${p.x},${p.y - d} ${p.x + d},${p.y} ${p.x},${p.y + d} ${p.x - d},${p.y}`}
        fill={c}
        stroke={G.bg}
        strokeWidth="0.3"
      />
    );
  }
  if (node.kind === "topic") {
    return (
      <>
        <circle cx={p.x} cy={p.y} r={r + 1.6} fill="none" stroke={c} strokeWidth="1.4" />
        <circle cx={p.x} cy={p.y} r={0.9} fill={c} />
      </>
    );
  }
  // observation — small dot
  return <circle cx={p.x} cy={p.y} r={Math.max(1.1, r * 0.6)} fill={c} opacity="0.85" />;
}

// Dream highlight ring, shaped to match the glyph kind.
function NodeGlyphRing({ node, p, color }: { node: GraphNode; p: Pos; color: string }) {
  const r = p.r + 3.2;
  if (node.kind === "entity") {
    const d = r;
    return (
      <polygon
        points={`${p.x},${p.y - d} ${p.x + d},${p.y} ${p.x},${p.y + d} ${p.x - d},${p.y}`}
        fill="none"
        stroke={color}
        strokeWidth="0.9"
        opacity="0.95"
      />
    );
  }
  return (
    <circle cx={p.x} cy={p.y} r={r} fill="none" stroke={color} strokeWidth="0.9" opacity="0.95" />
  );
}

function Legend({ G }: { G: typeof GOTHIC }) {
  const items: Array<{ glyph: string; label: string; color: string }> = [
    { glyph: "●", label: "memory", color: VALENCE_COLORS.calm },
    { glyph: "◆", label: "entity", color: G.accent },
    { glyph: "◌", label: "topic", color: VALENCE_COLORS.brooding },
    { glyph: "·", label: "obs", color: G.inkSoft },
  ];
  const edgeItems: Array<{ label: string; color: string }> = [
    { label: "similar", color: VALENCE_COLORS.calm },
    { label: "mentions", color: VALENCE_COLORS.warmth },
    { label: "tagged", color: VALENCE_COLORS.brooding },
    { label: "co", color: VALENCE_COLORS.towardHer },
  ];
  return (
    <div
      style={{
        margin: "10px 18px 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 14px",
        justifyContent: "center",
        fontFamily: SCORE_FONT_BODY,
        fontSize: 9,
        color: G.mute,
        fontStyle: "italic",
      }}
    >
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: it.color, fontSize: 11 }}>{it.glyph}</span>
          {it.label}
        </span>
      ))}
      <span style={{ opacity: 0.4 }}>|</span>
      {edgeItems.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span
            style={{ width: 12, height: 0, borderTop: `1.5px solid ${it.color}`, display: "inline-block" }}
          />
          {it.label}
        </span>
      ))}
      <span style={{ opacity: 0.4 }}>|</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: G.rose1 }}>
        <span style={{ fontSize: 11 }}>✦</span>
        dream
      </span>
    </div>
  );
}

function NodeCard({
  G,
  node,
  isDreamSurfaced,
  isDreamLinked,
  onClose,
}: {
  G: typeof GOTHIC;
  node: GraphNode;
  isDreamSurfaced: boolean;
  isDreamLinked: boolean;
  onClose: () => void;
}) {
  const dreamTag = isDreamSurfaced
    ? "✦ 昨夜浮现"
    : isDreamLinked
      ? "✦ 昨夜沿边走到"
      : null;
  return (
    <div
      style={{
        margin: "16px 18px 36px",
        padding: "14px 16px",
        border: `0.5px solid ${G.hair}`,
        borderRadius: 6,
        background: G.paper,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close detail"
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          background: "transparent",
          border: "none",
          color: G.mute,
          fontSize: 14,
          cursor: "pointer",
          opacity: 0.6,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: G.mute,
          fontSize: 9.5,
          letterSpacing: 2,
          fontFamily: SCORE_FONT_BODY,
        }}
      >
        <span>
          {node.kind.toUpperCase()}
          {node.subtype ? ` · ${node.subtype}` : ""}
        </span>
        {dreamTag && <span style={{ fontStyle: "italic", color: G.rose1 }}>{dreamTag}</span>}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: SCORE_FONT_BODY,
          fontStyle: "italic",
          fontSize: 14,
          lineHeight: 1.45,
          color: G.ink,
        }}
      >
        {node.label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 8,
          color: G.mute,
          letterSpacing: 1,
          fontStyle: "italic",
        }}
      >
        weight {node.weight.toFixed(2)}
        {typeof node.valence === "number" &&
          ` · valence ${node.valence >= 0 ? "+" : ""}${node.valence.toFixed(2)}`}
      </div>
    </div>
  );
}
