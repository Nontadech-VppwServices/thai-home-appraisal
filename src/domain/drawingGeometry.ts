import type { DrawingElement, DrawingKind } from "./drawings";

export type AreaHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type ResizeHandle = AreaHandle | "start" | "end";
export type Point = { x: number; y: number };

const linearKinds: readonly DrawingKind[] = ["line", "arrow", "wall", "window", "dimension"];

export function isLinearKind(kind: DrawingKind): boolean {
  return linearKinds.includes(kind);
}

export function rotatePoint(point: Point, center: Point, degrees: number): Point {
  const radians = degrees * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return { x: center.x + dx * cosine - dy * sine, y: center.y + dx * sine + dy * cosine };
}

/** Snap a dragged endpoint to the nearest 45-degree axis while preserving length. */
export function snapDrawingPoint(start: Point, current: Point, free = false): Point {
  if (free) return current;
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const length = Math.hypot(dx, dy);
  if (!length) return current;
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
}

/** Move one polygon vertex in the object's rotated local coordinate system. */
export function movePolygonVertex(item: DrawingElement, index: number, delta: Point): DrawingElement {
  if (item.kind !== "polygon" || !item.points || !item.points[index] || !item.width || !item.height) return item;
  const local = rotatePoint(delta, { x: 0, y: 0 }, -item.rotation);
  return { ...item, points: item.points.map((point, position) => position === index
    ? { x: Math.max(0, Math.min(1, point.x + local.x / item.width)), y: Math.max(0, Math.min(1, point.y + local.y / item.height)) }
    : point) };
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - start.x - fraction * dx, point.y - start.y - fraction * dy);
}

/** Prefer the visible shape; use the enlarged finger target only when nothing visible was hit. */
export function pickDrawingElement(elements: readonly DrawingElement[], worldPoint: Point, tolerance: number): string | null {
  let best: { id: string; exact: boolean; distance: number } | null = null;
  for (const item of elements) {
    const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
    const point = rotatePoint(worldPoint, center, -item.rotation);
    let distance: number;
    let exact: boolean;
    if (isLinearKind(item.kind)) {
      distance = distanceToSegment(point, { x: item.x, y: item.y }, { x: item.x + item.width, y: item.y + item.height });
      exact = distance <= Math.max(3, item.strokeWidth / 2);
    } else {
      const left = item.kind === "text" ? item.x : Math.min(item.x, item.x + item.width);
      const top = item.kind === "text" ? item.y : Math.min(item.y, item.y + item.height);
      const width = item.kind === "text" ? Math.min(Math.abs(item.width), (item.text || "ข้อความ").length * item.fontSize * 0.8) : Math.abs(item.width);
      const height = item.kind === "text" ? item.fontSize * 1.3 : Math.abs(item.height);
      const right = item.kind === "text" ? item.x + width : Math.max(item.x, item.x + item.width);
      const bottom = item.kind === "text" ? item.y + height : Math.max(item.y, item.y + item.height);
      distance = Math.hypot(Math.max(left - point.x, 0, point.x - right), Math.max(top - point.y, 0, point.y - bottom));
      exact = distance === 0;
      if (item.kind === "ellipse" && exact) {
        const rx = Math.max(1, width / 2);
        const ry = Math.max(1, height / 2);
        exact = ((point.x - center.x) / rx) ** 2 + ((point.y - center.y) / ry) ** 2 <= 1;
      }
    }
    if (distance > tolerance) continue;
    if (!best || (exact && !best.exact) || (exact === best.exact && (exact || distance <= best.distance))) {
      best = { id: item.id, exact, distance };
    }
  }
  return best?.id ?? null;
}

function rotateDelta(delta: Point, degrees: number): Point {
  return rotatePoint(delta, { x: 0, y: 0 }, degrees);
}

/** Resize in the element's local axes, keeping the opposite edge or endpoint fixed on screen. */
export function resizeDrawingElement(item: DrawingElement, handle: ResizeHandle, delta: Point): DrawingElement {
  const local = rotateDelta(delta, -item.rotation);
  if (handle === "start" || handle === "end") {
    if (!isLinearKind(item.kind)) return item;
    const start = { x: item.x, y: item.y };
    const end = { x: item.x + item.width, y: item.y + item.height };
    const nextStart = handle === "start" ? { x: start.x + local.x, y: start.y + local.y } : start;
    const nextEnd = handle === "end" ? { x: end.x + local.x, y: end.y + local.y } : end;
    const oldCenter = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const localCenterShift = { x: (nextStart.x + nextEnd.x) / 2 - oldCenter.x, y: (nextStart.y + nextEnd.y) / 2 - oldCenter.y };
    const worldCenterShift = rotateDelta(localCenterShift, item.rotation);
    const offset = { x: worldCenterShift.x - localCenterShift.x, y: worldCenterShift.y - localCenterShift.y };
    return { ...item, x: nextStart.x + offset.x, y: nextStart.y + offset.y, width: nextEnd.x - nextStart.x, height: nextEnd.y - nextStart.y };
  }
  if (isLinearKind(item.kind)) return item;

  const left = Math.min(item.x, item.x + item.width);
  const right = Math.max(item.x, item.x + item.width);
  const top = Math.min(item.y, item.y + item.height);
  const bottom = Math.max(item.y, item.y + item.height);
  const minSize = item.kind === "text" ? 12 : 20;
  let nextLeft = handle.includes("w") ? Math.min(left + local.x, right - minSize) : left;
  let nextRight = handle.includes("e") ? Math.max(right + local.x, left + minSize) : right;
  let nextTop = handle.includes("n") ? Math.min(top + local.y, bottom - minSize) : top;
  let nextBottom = handle.includes("s") ? Math.max(bottom + local.y, top + minSize) : bottom;
  let fontSize = item.fontSize;

  if (item.kind === "text") {
    const widthRatio = (nextRight - nextLeft) / Math.max(1, right - left);
    const heightRatio = (nextBottom - nextTop) / Math.max(1, bottom - top);
    fontSize = Math.max(12, Math.min(64, Math.round(item.fontSize * (widthRatio + heightRatio) / 2)));
    const scale = fontSize / item.fontSize;
    const width = (right - left) * scale;
    const height = (bottom - top) * scale;
    if (handle.includes("w")) nextLeft = right - width;
    else nextRight = left + width;
    if (handle.includes("n")) nextTop = bottom - height;
    else nextBottom = top + height;
  }

  const oldCenter = { x: (left + right) / 2, y: (top + bottom) / 2 };
  const nextCenter = { x: (nextLeft + nextRight) / 2, y: (nextTop + nextBottom) / 2 };
  const localCenterShift = { x: nextCenter.x - oldCenter.x, y: nextCenter.y - oldCenter.y };
  const worldCenterShift = rotateDelta(localCenterShift, item.rotation);
  const offset = { x: worldCenterShift.x - localCenterShift.x, y: worldCenterShift.y - localCenterShift.y };
  return {
    ...item,
    x: nextLeft + offset.x,
    y: nextTop + offset.y,
    width: nextRight - nextLeft,
    height: nextBottom - nextTop,
    fontSize,
  };
}
