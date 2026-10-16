import { DRAWING_HEIGHT, DRAWING_WIDTH, createDrawingElement, type DrawingElement } from "./drawings";

export type RawSegment = { x1: number; y1: number; x2: number; y2: number };
export type ImportCandidate = RawSegment & { id: string; kind: "wall" | "line"; included: boolean };

const CONTENT = { x: 90, y: 112, width: DRAWING_WIDTH - 180, height: DRAWING_HEIGHT - 160 };

/** Keep only useful near-axis line segments; neighboring stroke edges become one editable line. */
export function mergePlanSegments(raw: readonly RawSegment[], width: number, height: number): RawSegment[] {
  if (width <= 0 || height <= 0) return [];
  type AxisLine = { axis: "h" | "v"; at: number; start: number; end: number };
  const minLength = Math.max(24, Math.min(width, height) * 0.055);
  const lines: AxisLine[] = [];
  for (const segment of raw) {
    if (![segment.x1, segment.y1, segment.x2, segment.y2].every(Number.isFinite)) continue;
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const horizontal = Math.abs(dy) <= Math.abs(dx) * 0.27;
    const vertical = Math.abs(dx) <= Math.abs(dy) * 0.27;
    if (!horizontal && !vertical) continue;
    const start = horizontal ? Math.min(segment.x1, segment.x2) : Math.min(segment.y1, segment.y2);
    const end = horizontal ? Math.max(segment.x1, segment.x2) : Math.max(segment.y1, segment.y2);
    if (end - start < minLength) continue;
    lines.push({ axis: horizontal ? "h" : "v", at: horizontal ? (segment.y1 + segment.y2) / 2 : (segment.x1 + segment.x2) / 2, start, end });
  }
  lines.sort((a, b) => a.axis.localeCompare(b.axis) || a.at - b.at || a.start - b.start);
  const merged: AxisLine[] = [];
  const atTolerance = Math.max(5, Math.min(width, height) * 0.012);
  const gapTolerance = Math.max(12, Math.min(width, height) * 0.027);
  for (const line of lines) {
    const match = merged.find((item) => item.axis === line.axis && Math.abs(item.at - line.at) <= atTolerance && line.start <= item.end + gapTolerance && line.end >= item.start - gapTolerance);
    if (match) {
      const oldLength = match.end - match.start;
      const newLength = line.end - line.start;
      match.at = (match.at * oldLength + line.at * newLength) / (oldLength + newLength);
      match.start = Math.min(match.start, line.start);
      match.end = Math.max(match.end, line.end);
    } else merged.push({ ...line });
  }
  return merged.filter((line) => line.end - line.start >= minLength).map((line) => line.axis === "h"
    ? { x1: Math.max(0, line.start), y1: Math.max(0, Math.min(height, line.at)), x2: Math.min(width, line.end), y2: Math.max(0, Math.min(height, line.at)) }
    : { x1: Math.max(0, Math.min(width, line.at)), y1: Math.max(0, line.start), x2: Math.max(0, Math.min(width, line.at)), y2: Math.min(height, line.end) });
}

export function createImportCandidates(segments: readonly RawSegment[], width: number, height: number): ImportCandidate[] {
  return mergePlanSegments(segments, width, height).map((segment, index) => ({
    ...segment,
    id: `candidate-${index}`,
    kind: Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) >= Math.min(width, height) * 0.22 ? "wall" : "line",
    included: true,
  }));
}

/** Letterbox the cropped image's coordinates into the existing 1000×700 drawing canvas. */
export function importedElements(candidates: readonly ImportCandidate[], width: number, height: number, makeId: () => string): DrawingElement[] {
  if (width <= 0 || height <= 0) return [];
  const scale = Math.min(CONTENT.width / width, CONTENT.height / height);
  const offsetX = CONTENT.x + (CONTENT.width - width * scale) / 2;
  const offsetY = CONTENT.y + (CONTENT.height - height * scale) / 2;
  return candidates.filter((candidate) => candidate.included).map((candidate) => {
    const x1 = offsetX + candidate.x1 * scale;
    const y1 = offsetY + candidate.y1 * scale;
    const x2 = offsetX + candidate.x2 * scale;
    const y2 = offsetY + candidate.y2 * scale;
    const base = createDrawingElement(candidate.kind, makeId(), x1, y1);
    return { ...base, width: x2 - x1, height: y2 - y1, stroke: "#111827", strokeWidth: candidate.kind === "wall" ? 4 : 2 };
  });
}
