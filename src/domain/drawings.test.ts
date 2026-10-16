import { describe, expect, it } from "vitest";
import { createEmptyJob, normalizeStoredJob } from "./appraisal";
import { createDrawing, createDrawingElement, createDrawingMaterial, drawingMaterials, drawingTypes, moveElement, normalizeDrawings } from "./drawings";

describe("illustrative drawings", () => {
  it("มีเทมเพลตแก้ไขได้เฉพาะห้อง อาคาร และแปลนบ้าน", () => {
    const job = createEmptyJob("job-1", "2026-09-22");
    job.drawings = drawingTypes.map((type, index) => createDrawing(type, `drawing-${index}`, "2026-09-22T00:00:00.000Z"));
    expect(job.drawings).toHaveLength(3);
    expect(job.drawings.every((drawing) => drawing.elements.length > 1 && !drawing.includeInReport)).toBe(true);
    expect(new Set(job.drawings.map((drawing) => drawing.type)).size).toBe(3);
    expect(drawingTypes).toEqual(["room", "building", "housePlan"]);
    const kinds = job.drawings[0].elements.map((item) => item.kind);
    for (const kind of ["wall", "door", "window", "dimension"]) expect(kinds).toContain(kind);
    expect(job.drawings[0].elements.every((item) => !["เตียง", "โซฟา", "โต๊ะ"].includes(item.text))).toBe(true);
  });

  it("สร้างแปลนบ้านแยกชั้นจากแม่แบบทั่วไป และแผ่นเปล่า", () => {
    const at = "2026-09-22T00:00:00.000Z";
    const single = createDrawing("housePlan", "single", at);
    const ground = createDrawing("housePlan", "ground", at, "ground");
    const upper = createDrawing("housePlan", "upper", at, "upper");
    const blank = createDrawing("housePlan", "blank", at, "blank");
    expect([single, ground, upper, blank].map((drawing) => drawing.title)).toEqual(["แปลนบ้านชั้นเดียว", "แปลนชั้นล่าง", "แปลนชั้นบน", "แปลนแผ่นเปล่า"]);
    expect(single.elements.some((item) => item.kind === "stairs")).toBe(true);
    expect(upper.elements.some((item) => item.hatch)).toBe(true);
    expect(blank.elements).toHaveLength(2);
    expect([single, ground, upper].every((drawing) => drawing.elements.length < 300 && drawing.elements.some((item) => item.kind === "dimension"))).toBe(true);
  });

  it("รักษาจุดพื้นที่ แรเงา เส้นประ และทิศประตูเมื่อบันทึก โดยกรองค่าที่ไม่ปลอดภัย", () => {
    const polygon = { ...createDrawingElement("polygon", "shape"), points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.8, y: 1 }, { x: 0, y: 1 }], hatch: true, dashed: true };
    const door = { ...createDrawingElement("door", "door"), swing: "right" as const, doorStyle: "double" as const };
    const stairs = { ...createDrawingElement("stairs", "stairs"), stairsStyle: "u" as const };
    const drawing = { ...createDrawing("housePlan", "plan", "now", "blank"), elements: [polygon, door, stairs] };
    const restored = normalizeDrawings([drawing])[0];
    expect(restored.elements[0]).toMatchObject({ points: polygon.points, hatch: true, dashed: true });
    expect(restored.elements[1].swing).toBe("right");
    expect(restored.elements[1].doorStyle).toBe("double");
    expect(restored.elements[2].stairsStyle).toBe("u");
    const invalid = normalizeDrawings([{ ...drawing, elements: [{ ...polygon, points: [{ x: 0, y: 0 }, { x: Infinity, y: 0 }, { x: 1, y: 1 }] }] }])[0].elements[0];
    expect(invalid.points).toHaveLength(4);
    expect(normalizeDrawings([{ ...drawing, elements: [{ ...polygon, points: [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] }] }])[0].elements[0].points?.[1].x).toBe(1);
  });

  it("เติมข้อมูลแบบว่างให้ localStorage รุ่นก่อนและคงแบบที่เคยบันทึก", () => {
    expect(normalizeStoredJob({ id: "old" }, "2026-09-22")?.drawings).toEqual([]);
    const drawing = createDrawing("room", "room-1", "2026-09-22T00:00:00.000Z");
    const job = normalizeStoredJob({ id: "new", drawings: [drawing] }, "2026-09-22");
    expect(job?.drawings[0]).toMatchObject({ id: "room-1", type: "room", includeInReport: false });
  });

  it("มีวัสดุประเมินหลักครบและสร้างวัตถุ variant ที่แก้ไขต่อได้", () => {
    expect(drawingMaterials.map((item) => item.id)).toEqual(expect.arrayContaining(["wall", "doorDouble", "stairsL", "hatchPolygon", "inspectionLine", "callout"]));
    expect(createDrawingMaterial("doorDouble", "door", 10, 20)).toMatchObject({ kind: "door", doorStyle: "double", width: 110 });
    expect(createDrawingMaterial("stairsL", "stairs", 10, 20)).toMatchObject({ kind: "stairs", stairsStyle: "l" });
    expect(createDrawingMaterial("roomLabel", "label", 10, 20, "ครัว")).toMatchObject({ kind: "symbol", text: "ครัว" });
    expect(createDrawingMaterial("inspectionLine", "inspection", 10, 20)).toMatchObject({ kind: "line", stroke: "#bc596d" });
  });

  it("ทิ้งวัตถุไม่รู้จักและจำกัดค่าที่อาจทำให้ SVG หรือข้อมูลเสีย", () => {
    const drawing = createDrawing("room", "room-1", "2026-09-22T00:00:00.000Z");
    const normalized = normalizeDrawings([{ ...drawing, elements: [
      { ...drawing.elements[0], text: "x".repeat(200), fill: "url(javascript:alert(1))", x: Infinity },
      { ...drawing.elements[0], id: "bad", kind: "foreignObject" },
    ] }]);
    expect(normalized[0].elements).toHaveLength(1);
    expect(normalized[0].elements[0]).toMatchObject({ fill: "#0f172a", x: 120 });
    expect(normalized[0].elements[0].text).toHaveLength(120);
  });

  it("เปลี่ยนลำดับชั้นแบบไม่แก้ข้อมูลต้นฉบับ", () => {
    const drawing = createDrawing("room", "room-1", "2026-09-22T00:00:00.000Z");
    const before = drawing.elements.map((item) => item.id);
    const after = moveElement(drawing.elements, before[1], "up").map((item) => item.id);
    expect(after.slice(0, 3)).toEqual([before[0], before[2], before[1]]);
    expect(drawing.elements.map((item) => item.id)).toEqual(before);
  });
});
