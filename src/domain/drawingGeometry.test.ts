import { describe, expect, it } from "vitest";
import { createDrawingElement } from "./drawings";
import { movePolygonVertex, pickDrawingElement, resizeDrawingElement, rotatePoint, snapDrawingPoint } from "./drawingGeometry";

function renderedPoint(x: number, y: number, item: ReturnType<typeof createDrawingElement>) {
  return rotatePoint({ x, y }, { x: item.x + item.width / 2, y: item.y + item.height / 2 }, item.rotation);
}

describe("drawing resize geometry", () => {
  it("snaps drawing endpoints to every 45-degree axis and supports free angle", () => {
    const start = { x: 100, y: 100 };
    const cases = [[180, 110, 0], [170, 160, 45], [110, 180, 90], [40, 170, 135], [20, 90, -180], [30, 40, -135], [90, 20, -90], [170, 40, -45]] as const;
    for (const [x, y, degrees] of cases) {
      const snapped = snapDrawingPoint(start, { x, y });
      expect(Math.atan2(snapped.y - start.y, snapped.x - start.x) * 180 / Math.PI).toBeCloseTo(degrees);
    }
    expect(snapDrawingPoint(start, { x: 177, y: 133 }, true)).toEqual({ x: 177, y: 133 });
  });
  it("keeps the opposite edge fixed when a rotated object is resized", () => {
    const item = { ...createDrawingElement("rect", "rect", 100, 100), width: 100, height: 80, rotation: 90 };
    const before = renderedPoint(100, 140, item);
    const resized = resizeDrawingElement(item, "e", { x: 0, y: 20 });
    const after = renderedPoint(resized.x, resized.y + resized.height / 2, resized);
    expect(resized.width).toBeCloseTo(120);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it("normalizes negative dimensions and prevents a handle from crossing the opposite edge", () => {
    const item = { ...createDrawingElement("rect", "rect", 200, 160), width: -100, height: -60 };
    const resized = resizeDrawingElement(item, "nw", { x: -20, y: -10 });
    expect(resized).toMatchObject({ x: 80, y: 90, width: 120, height: 70 });
    expect(resizeDrawingElement(item, "e", { x: -200, y: 0 }).width).toBe(20);
  });

  it("moves either endpoint of horizontal, vertical, and rotated lines independently", () => {
    const vertical = { ...createDrawingElement("wall", "wall", 100, 100), width: 0, height: 100 };
    expect(resizeDrawingElement(vertical, "end", { x: 20, y: 30 })).toMatchObject({ x: 100, y: 100, width: 20, height: 130 });
    const reversed = { ...createDrawingElement("line", "line", 200, 100), width: -100, height: 0 };
    expect(resizeDrawingElement(reversed, "start", { x: 20, y: 10 })).toMatchObject({ x: 220, y: 110, width: -120, height: -10 });
    const rotated = { ...vertical, rotation: 90 };
    const beforeEnd = renderedPoint(rotated.x + rotated.width, rotated.y + rotated.height, rotated);
    const changed = resizeDrawingElement(rotated, "start", { x: 15, y: 0 });
    const afterEnd = renderedPoint(changed.x + changed.width, changed.y + changed.height, changed);
    expect(afterEnd.x).toBeCloseTo(beforeEnd.x);
    expect(afterEnd.y).toBeCloseTo(beforeEnd.y);
  });

  it("resizes text by changing font size while keeping the opposite corner", () => {
    const item = createDrawingElement("text", "text", 100, 100, "แปลง");
    const changed = resizeDrawingElement(item, "se", { x: 110, y: 24 });
    expect(changed.fontSize).toBe(45);
    expect(changed.x).toBe(100);
    expect(changed.y).toBe(100);
    expect(changed.width).toBe(330);
    expect(changed.height).toBe(72);
  });

  it("selects the visible filled shape before an enlarged overlapping line target", () => {
    const area = { ...createDrawingElement("rect", "area", 100, 100), width: 160, height: 80 };
    const line = { ...createDrawingElement("line", "line", 100, 100), width: 160, height: 0 };
    expect(pickDrawingElement([area, line], { x: 180, y: 118 }, 22)).toBe("area");
    expect(pickDrawingElement([area, line], { x: 180, y: 101 }, 22)).toBe("line");
    expect(pickDrawingElement([area, line], { x: 500, y: 500 }, 22)).toBeNull();
  });

  it("moves polygon vertices in rotated local coordinates without moving other points", () => {
    const item = { ...createDrawingElement("polygon", "p", 100, 100), width: 100, height: 100, rotation: 90 };
    const changed = movePolygonVertex(item, 0, { x: 0, y: 20 });
    expect(changed.points?.[0].x).toBeCloseTo(0.35);
    expect(changed.points?.[0].y).toBeCloseTo(0);
    expect(changed.points?.[1]).toEqual(item.points?.[1]);
    expect(item.points?.[0]).toEqual({ x: 0.15, y: 0 });
  });
});
