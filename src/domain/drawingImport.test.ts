import { describe, expect, it } from "vitest";
import { createImportCandidates, importedElements, mergePlanSegments } from "./drawingImport";

describe("drawing image import", () => {
  it("merges duplicate stroke edges and nearby collinear segments", () => {
    const result = mergePlanSegments([
      { x1: 10, y1: 20, x2: 110, y2: 20 },
      { x1: 12, y1: 24, x2: 112, y2: 24 },
      { x1: 113, y1: 21, x2: 190, y2: 21 },
      { x1: 45, y1: 45, x2: 50, y2: 50 },
    ], 200, 150);
    expect(result).toHaveLength(1);
    expect(result[0].x1).toBe(10);
    expect(result[0].x2).toBe(190);
  });

  it("keeps the crop aspect ratio and creates existing editable kinds", () => {
    const candidates = createImportCandidates([{ x1: 0, y1: 0, x2: 200, y2: 0 }], 200, 400);
    const elements = importedElements(candidates, 200, 400, () => "line-1");
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({ id: "line-1", kind: "wall", x: 365, y: 112, width: 270, height: 0 });
    expect(importedElements([{ ...candidates[0], included: false }], 200, 400, () => "unused")).toEqual([]);
  });

  it("ignores invalid and diagonal detections", () => {
    expect(mergePlanSegments([{ x1: 0, y1: 0, x2: 100, y2: 100 }, { x1: NaN, y1: 0, x2: 100, y2: 0 }], 200, 200)).toEqual([]);
  });
});
