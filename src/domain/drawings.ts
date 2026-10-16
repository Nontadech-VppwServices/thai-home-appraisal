/** Illustrative diagrams only. Coordinates are SVG units, never survey measurements. */
export const DRAWING_WIDTH = 1000;
export const DRAWING_HEIGHT = 700;

export const drawingTypes = ["room", "building", "housePlan"] as const;
export type DrawingType = (typeof drawingTypes)[number];

export const drawingLabels: Record<DrawingType, string> = {
  room: "แปลงห้องพัก",
  building: "แปลงอาคาร",
  housePlan: "แปลนบ้าน",
};

export type DrawingKind = "rect" | "ellipse" | "polygon" | "line" | "arrow" | "text" | "symbol" | "wall" | "door" | "window" | "dimension" | "stairs" | "callout";
export const drawingKindLabels: Record<DrawingKind, string> = {
  rect: "สี่เหลี่ยม", ellipse: "วงรี", polygon: "รูปแปลง", line: "เส้น", arrow: "ลูกศร", text: "ข้อความ", symbol: "สัญลักษณ์", wall: "ผนัง", door: "ประตู", window: "หน้าต่าง", dimension: "เส้นกำกับ", stairs: "บันได", callout: "หมายเลขตรวจสอบ",
};
export type DrawingPoint = { x: number; y: number }; // Local 0..1 coordinates, scaled with the object.
export type HousePlanStarter = "blank" | "single" | "ground" | "upper";
export type DrawingElement = {
  id: string;
  kind: DrawingKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  text: string;
  points?: DrawingPoint[];
  hatch?: boolean;
  dashed?: boolean;
  swing?: "left" | "right";
  doorStyle?: "single" | "double";
  stairsStyle?: "straight" | "l" | "u";
};

export type DrawingDocument = {
  id: string;
  type: DrawingType;
  title: string;
  elements: DrawingElement[];
  includeInReport: boolean;
  updatedAt: string;
};

export const drawingPalette: Record<DrawingType, readonly string[]> = {
  room: ["ห้อง", "ระเบียง", "ห้องน้ำ", "ทางเดิน", "ทางเข้า"],
  building: ["อาคาร", "ทางเข้า", "ลานจอดรถ", "บันได", "พื้นที่ส่วนกลาง"],
  housePlan: ["ห้องนอน", "ห้องน้ำ", "โถง", "ครัว", "เฉลียง", "ระเบียง", "ส่วนต่อเติม"],
};

const allowedKinds: DrawingKind[] = ["rect", "ellipse", "polygon", "line", "arrow", "text", "symbol", "wall", "door", "window", "dimension", "stairs", "callout"];
const hexColor = /^#[0-9a-fA-F]{6}$/;

export function createDrawingElement(kind: DrawingKind, id: string, x = 120, y = 110, text = ""): DrawingElement {
  return {
    id,
    kind,
    x,
    y,
    width: ["line", "arrow", "wall", "window", "dimension"].includes(kind) ? 180 : kind === "door" ? 70 : kind === "text" ? 220 : kind === "stairs" ? 130 : kind === "callout" ? 150 : 160,
    height: ["line", "arrow", "wall", "window", "dimension"].includes(kind) ? 0 : kind === "door" ? 70 : kind === "text" ? 48 : kind === "stairs" ? 150 : kind === "callout" ? 70 : 100,
    rotation: 0,
    fill: ["text", "line", "arrow", "wall", "door", "window", "dimension"].includes(kind) ? "#0f172a" : kind === "stairs" || kind === "callout" ? "#ffffff" : "#d9f2ed",
    stroke: kind === "wall" ? "#111827" : kind === "callout" ? "#bc596d" : kind === "door" || kind === "window" || kind === "dimension" ? "#94a3b8" : "#0f766e",
    strokeWidth: kind === "wall" ? 10 : 3,
    fontSize: 30,
    text: text.slice(0, 120),
    ...(kind === "polygon" ? { points: [{ x: 0.15, y: 0 }, { x: 1, y: 0.13 }, { x: 0.85, y: 1 }, { x: 0, y: 0.86 }] } : {}),
  };
}

export type DrawingMaterialCategory = "draw" | "openings" | "structure" | "area" | "annotation";
export type DrawingMaterialMode = "draw" | "stamp";
export type DrawingMaterialId = "wall" | "line" | "arrow" | "dimension" | "doorLeft" | "doorRight" | "doorDouble" | "window" | "column" | "stairsStraight" | "stairsL" | "stairsU" | "hatchRect" | "hatchPolygon" | "porch" | "extension" | "text" | "roomLabel" | "inspectionLine" | "leader" | "callout";
export type DrawingMaterialDefinition = { id: DrawingMaterialId; category: DrawingMaterialCategory; label: string; mode: DrawingMaterialMode };

export const drawingMaterialCategories: ReadonlyArray<{ id: DrawingMaterialCategory; label: string }> = [
  { id: "draw", label: "วาดเส้น" }, { id: "openings", label: "ช่องเปิด" }, { id: "structure", label: "โครงสร้าง" }, { id: "area", label: "พื้นที่" }, { id: "annotation", label: "คำอธิบาย" },
];

export const drawingMaterials: readonly DrawingMaterialDefinition[] = [
  { id: "wall", category: "draw", label: "ผนัง", mode: "draw" }, { id: "line", category: "draw", label: "เส้น", mode: "draw" }, { id: "arrow", category: "draw", label: "ลูกศร", mode: "draw" }, { id: "dimension", category: "draw", label: "เส้นกำกับ", mode: "draw" },
  { id: "doorLeft", category: "openings", label: "ประตูซ้าย", mode: "stamp" }, { id: "doorRight", category: "openings", label: "ประตูขวา", mode: "stamp" }, { id: "doorDouble", category: "openings", label: "ประตูคู่", mode: "stamp" }, { id: "window", category: "openings", label: "หน้าต่าง", mode: "stamp" },
  { id: "column", category: "structure", label: "เสา", mode: "stamp" }, { id: "stairsStraight", category: "structure", label: "บันไดตรง", mode: "stamp" }, { id: "stairsL", category: "structure", label: "บันได L", mode: "stamp" }, { id: "stairsU", category: "structure", label: "บันได U", mode: "stamp" },
  { id: "hatchRect", category: "area", label: "แรเงาสี่เหลี่ยม", mode: "stamp" }, { id: "hatchPolygon", category: "area", label: "แรเงารูปทรง", mode: "stamp" }, { id: "porch", category: "area", label: "เฉลียง", mode: "stamp" }, { id: "extension", category: "area", label: "ส่วนต่อเติม", mode: "stamp" },
  { id: "text", category: "annotation", label: "ข้อความ", mode: "stamp" }, { id: "roomLabel", category: "annotation", label: "ป้ายห้อง", mode: "stamp" }, { id: "inspectionLine", category: "annotation", label: "เส้นตรวจสอบ", mode: "draw" }, { id: "leader", category: "annotation", label: "เส้นชี้", mode: "draw" }, { id: "callout", category: "annotation", label: "วงรีหมายเลข", mode: "stamp" },
];

export function createDrawingMaterial(materialId: DrawingMaterialId, id: string, x: number, y: number, roomLabel = "ห้อง"): DrawingElement {
  const make = (kind: DrawingKind, text = "", options: Partial<DrawingElement> = {}) => ({ ...createDrawingElement(kind, id, x, y, text), ...options });
  switch (materialId) {
    case "wall": return make("wall");
    case "line": return make("line");
    case "arrow": return make("arrow");
    case "dimension": return make("dimension", "ระยะอ้างอิง");
    case "doorLeft": return make("door", "", { swing: "left", doorStyle: "single" });
    case "doorRight": return make("door", "", { swing: "right", doorStyle: "single" });
    case "doorDouble": return make("door", "", { width: 110, doorStyle: "double" });
    case "window": return make("window");
    case "column": return make("rect", "", { width: 42, height: 42, fill: "#ffffff", stroke: "#111827", strokeWidth: 5 });
    case "stairsStraight": return make("stairs", "", { stairsStyle: "straight" });
    case "stairsL": return make("stairs", "", { width: 150, height: 150, stairsStyle: "l" });
    case "stairsU": return make("stairs", "", { width: 170, height: 150, stairsStyle: "u" });
    case "hatchRect": return make("rect", "", { width: 220, height: 130, fill: "#ffffff", stroke: "#c76a8f", hatch: true });
    case "hatchPolygon": return make("polygon", "", { width: 220, height: 150, fill: "#ffffff", stroke: "#c76a8f", hatch: true });
    case "porch": return make("rect", "เฉลียง", { width: 240, height: 90, fill: "#ffffff", stroke: "#c76a8f", hatch: true });
    case "extension": return make("rect", "ส่วนต่อเติม", { width: 240, height: 120, fill: "#ffffff", stroke: "#c76a8f", hatch: true, dashed: true });
    case "text": return make("text", "ข้อความใหม่");
    case "roomLabel": return make("symbol", roomLabel, { width: 150, height: 52, fill: "#ffffff", stroke: "#cbd5e1" });
    case "inspectionLine": return make("line", "", { stroke: "#bc596d", strokeWidth: 2 });
    case "leader": return make("arrow", "", { stroke: "#bc596d", strokeWidth: 2 });
    case "callout": return make("callout", "1", { stroke: "#bc596d", strokeWidth: 2, fontSize: 18 });
  }
}

function element(kind: DrawingKind, id: string, x: number, y: number, width: number, height: number, text = "", fill?: string): DrawingElement {
  const base = createDrawingElement(kind, id, x, y, text);
  return { ...base, width, height, fill: fill ?? base.fill };
}

/** A plan-like starter. Every wall, opening, fixture and guide stays editable. */
function roomElements(id: string): DrawingElement[] {
  const parts: DrawingElement[] = [];
  let count = 0;
  const add = (kind: DrawingKind, x: number, y: number, width: number, height: number, text = "", options: Partial<DrawingElement> = {}) => {
    parts.push({ ...element(kind, `${id}-plan-${count++}`, x, y, width, height, text), ...options });
  };
  add("text", 80, 38, 260, 42, "ผังห้องพัก", { fill: "#111827", fontSize: 28 });
  add("text", 80, 77, 220, 30, "ภาพประกอบ · ไม่มีสเกล", { fill: "#64748b", fontSize: 15 });

  // Outer walls and the bathroom return. Gaps are openings, not covered rectangles.
  add("wall", 300, 145, 0, 395);
  add("wall", 300, 540, 72, 0);
  add("wall", 445, 540, 230, 0);
  add("wall", 675, 145, 0, 305);
  add("wall", 675, 450, 110, 0);
  add("wall", 785, 450, 0, 90);
  add("wall", 675, 540, 110, 0);
  add("wall", 675, 450, 0, 28);
  add("wall", 675, 522, 0, 18);
  add("wall", 300, 145, 75, 0);
  add("wall", 615, 145, 60, 0);
  add("window", 375, 145, 240, 0);
  add("door", 372, 468, 72, 72, "ประตูเข้า", { stroke: "#9ca3af" });
  add("door", 675, 478, 44, 44, "ประตูห้องน้ำ", { rotation: 90, stroke: "#9ca3af" });

  // Areas and circulation are intentionally bare so the plan describes the asset.
  add("rect", 300, 93, 375, 52, "", { fill: "#ffffff", stroke: "#cbd5e1", strokeWidth: 2 });
  for (let y = 101; y < 143; y += 8) add("line", 306, y, 363, 0, "", { stroke: "#e2e8f0", strokeWidth: 1 });
  add("text", 445, 106, 150, 28, "ระเบียง", { fill: "#be6673", fontSize: 19 });
  add("wall", 300, 377, 160, 0, "", { strokeWidth: 5 });
  add("wall", 520, 377, 155, 0, "", { strokeWidth: 5 });
  add("door", 460, 317, 60, 60, "ประตูภายใน", { stroke: "#9ca3af" });
  add("text", 426, 240, 170, 30, "พื้นที่พักผ่อน", { fill: "#be6673", fontSize: 19 });
  add("text", 455, 451, 170, 28, "พื้นที่นอน", { fill: "#be6673", fontSize: 19 });
  add("text", 699, 481, 80, 24, "ห้องน้ำ", { fill: "#be6673", fontSize: 16 });

  // Entry landing and reference lines; labels are illustrative, never calculated lengths.
  add("rect", 362, 545, 300, 114, "", { fill: "#ffffff", stroke: "#cbd5e1", strokeWidth: 2 });
  for (let y = 568; y < 653; y += 22) add("line", 365, y, 294, 0, "", { stroke: "#cbd5e1", strokeWidth: 2 });
  add("text", 476, 590, 120, 26, "ทางเข้า", { fill: "#be6673", fontSize: 18 });
  add("dimension", 300, 74, 375, 0, "แนวหน้าห้อง", { stroke: "#94a3b8", fontSize: 17 });
  add("line", 300, 85, 0, 50, "", { stroke: "#cbd5e1", strokeWidth: 1 });
  add("line", 675, 85, 0, 50, "", { stroke: "#cbd5e1", strokeWidth: 1 });
  add("dimension", 251, 145, 0, 395, "แนวห้อง", { stroke: "#94a3b8", fontSize: 17 });
  add("line", 263, 145, 28, 0, "", { stroke: "#cbd5e1", strokeWidth: 1 });
  add("line", 263, 540, 28, 0, "", { stroke: "#cbd5e1", strokeWidth: 1 });
  add("text", 803, 638, 160, 30, "ไม่มีสเกล", { fill: "#64748b", fontSize: 16 });
  return parts;
}

/** Editable building starter for small residential appraisal work. */
function buildingElements(id: string): DrawingElement[] {
  const parts: DrawingElement[] = [];
  let count = 0;
  const add = (kind: DrawingKind, x: number, y: number, width: number, height: number, text = "", options: Partial<DrawingElement> = {}) => {
    parts.push({ ...element(kind, `${id}-plan-${count++}`, x, y, width, height, text), ...options });
  };
  const outline = { fill: "#ffffff", stroke: "#334155", strokeWidth: 2 };
  const guide = { stroke: "#cbd5e1", strokeWidth: 1.5 };
  const caption = (x: number, y: number, text: string, size = 18) => add("text", x, y, 220, 30, text, { fill: "#be6673", fontSize: size });
  const box = (x: number, y: number, width: number, height: number) => add("rect", x, y, width, height, "", outline);
  add("text", 72, 42, 500, 44, drawingLabels.building, { fill: "#111827", fontSize: 30 });
  add("text", 72, 82, 260, 26, "ภาพประกอบ · ไม่มีสเกล", { fill: "#64748b", fontSize: 15 });
  add("arrow", 895, 178, 0, -70, "", { stroke: "#334155", strokeWidth: 2 });
  add("text", 887, 78, 40, 32, "N", { fill: "#334155", fontSize: 20 });

  add("wall", 225, 145, 535, 0); add("wall", 225, 145, 0, 390);
  add("wall", 760, 145, 0, 390); add("wall", 225, 535, 175, 0); add("wall", 485, 535, 275, 0);
  add("wall", 225, 335, 535, 0); add("wall", 490, 145, 0, 390);
  add("door", 400, 450, 85, 85, "ทางเข้า");
  add("door", 490, 262, 67, 67, "ประตูภายใน");
  add("window", 275, 145, 160, 0); add("window", 550, 145, 155, 0);
  add("window", 230, 450, 0, 68, "", { rotation: 90 });
  caption(280, 226, "ห้อง A", 20); caption(555, 226, "ห้อง B", 20);
  caption(280, 405, "พื้นที่ส่วนกลาง", 18); caption(540, 405, "ห้อง C", 20);
  box(58, 327, 135, 208);
  for (let y = 370; y < 530; y += 42) add("line", 65, y, 120, 0, "", guide);
  caption(76, 284, "จอดรถ", 16);
  add("line", 225, 600, 535, 0, "", guide);
  caption(422, 608, "ทางเข้าหลัก", 17);
  return parts;
}

export const housePlanStarterLabels: Record<HousePlanStarter, string> = {
  blank: "แผ่นเปล่า", single: "บ้านชั้นเดียว", ground: "ชั้นล่าง", upper: "ชั้นบน",
};

function housePlanElements(id: string, starter: HousePlanStarter): DrawingElement[] {
  const parts: DrawingElement[] = [];
  const add = (kind: DrawingKind, x: number, y: number, width: number, height: number, text = "", options: Partial<DrawingElement> = {}) => {
    parts.push({ ...element(kind, `${id}-plan-${parts.length}`, x, y, width, height, text), ...options });
  };
  add("text", 70, 28, 520, 36, `แปลน${housePlanStarterLabels[starter]}`, { fontSize: 28 });
  add("text", 70, 67, 380, 26, "ภาพประกอบ · ไม่มีสเกล", { fill: "#64748b", fontSize: 16 });
  if (starter === "blank") return parts;

  // A generic editable plan, not a transcription of the supplied photographs.
  const top = starter === "upper" ? 145 : 135;
  const bottom = starter === "upper" ? 555 : 545;
  const left = 220;
  const right = 760;
  const wall = (x: number, y: number, w: number, h: number) => add("wall", x, y, w, h, "", { stroke: "#111827", strokeWidth: 5 });
  wall(left, top, right - left, 0); wall(left, top, 0, bottom - top);
  wall(right, top, 0, bottom - top); wall(left, bottom, 205, 0); wall(495, bottom, right - 495, 0);
  add("door", 425, bottom - 70, 70, 70, "", { stroke: "#111827" });
  add("dimension", left, 105, right - left, 0, "ระยะ (กรอกเอง)", { fontSize: 17 });
  add("dimension", 805, top, 0, bottom - top, "ระยะ (กรอกเอง)", { fontSize: 17 });
  add("line", 185, top, 28, 0, "", { stroke: "#64748b", strokeWidth: 1 });
  add("line", 185, bottom, 28, 0, "", { stroke: "#64748b", strokeWidth: 1 });
  if (starter === "upper") {
    wall(left, 375, 205, 0); wall(495, 375, 265, 0);
    wall(465, top, 0, 160); wall(465, 365, 0, bottom - 365);
    add("door", 425, 305, 70, 70, "", { stroke: "#111827", swing: "right" });
    add("stairs", 630, 390, 110, 140);
    add("text", 280, 240, 160, 28, "ห้องนอน", { fontSize: 19 });
    add("text", 555, 240, 160, 28, "ห้องนอน", { fontSize: 19 });
    add("text", 275, 450, 150, 28, "โถง", { fontSize: 19 });
    add("rect", left, 555, 540, 72, "", { fill: "#ffffff", stroke: "#c76a8f", hatch: true, strokeWidth: 1 });
    add("text", 415, 578, 170, 24, "ระเบียง", { fontSize: 18 });
  } else {
    wall(left, 330, 165, 0); wall(455, 330, 305, 0);
    wall(515, top, 0, 120); wall(515, 325, 0, bottom - 325);
    add("door", 385, 260, 70, 70, "", { stroke: "#111827" });
    add("door", 515, 255, 70, 70, "", { stroke: "#111827", swing: "right" });
    add("stairs", 625, 365, 110, 145);
    add("text", 290, 230, 170, 30, starter === "ground" ? "ห้องรับแขก" : "ห้องนอน", { fontSize: 19 });
    add("text", 580, 225, 155, 30, "ห้องน้ำ", { fontSize: 19 });
    add("text", 285, 435, 155, 30, starter === "ground" ? "ครัว" : "โถง", { fontSize: 19 });
    add("rect", left, 560, 540, 80, "", { fill: "#ffffff", stroke: "#c76a8f", hatch: true, strokeWidth: 1 });
    add("text", 410, 580, 170, 26, "เฉลียง", { fontSize: 18 });
  }
  add("ellipse", 108, 575, 48, 30, "1", { fill: "#ffffff", stroke: "#bc596d", fontSize: 18 });
  add("line", 160, 590, 50, 0, "", { stroke: "#bc596d", strokeWidth: 1.5 });
  return parts;
}

function starterElements(type: DrawingType, id: string, starter: HousePlanStarter): DrawingElement[] {
  return type === "housePlan" ? housePlanElements(id, starter) : type === "room" ? roomElements(id) : buildingElements(id);
}

export function createDrawing(type: DrawingType, id: string, at: string, starter: HousePlanStarter = "single"): DrawingDocument {
  return { id, type, title: type === "housePlan" ? `แปลน${housePlanStarterLabels[starter]}` : drawingLabels[type], elements: starterElements(type, id, starter), includeInReport: false, updatedAt: at };
}

function finite(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

export function normalizeDrawingElement(value: unknown): DrawingElement | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 100 || !allowedKinds.includes(raw.kind as DrawingKind)) return null;
  const base = createDrawingElement(raw.kind as DrawingKind, raw.id);
  return {
    ...base,
    x: finite(raw.x, base.x, -DRAWING_WIDTH, DRAWING_WIDTH * 2),
    y: finite(raw.y, base.y, -DRAWING_HEIGHT, DRAWING_HEIGHT * 2),
    width: finite(raw.width, base.width, -DRAWING_WIDTH, DRAWING_WIDTH * 2),
    height: finite(raw.height, base.height, -DRAWING_HEIGHT, DRAWING_HEIGHT * 2),
    rotation: finite(raw.rotation, 0, -360, 360),
    strokeWidth: finite(raw.strokeWidth, 3, 0, 24),
    fontSize: finite(raw.fontSize, base.fontSize, 12, 64),
    fill: typeof raw.fill === "string" && hexColor.test(raw.fill) ? raw.fill : base.fill,
    stroke: typeof raw.stroke === "string" && hexColor.test(raw.stroke) ? raw.stroke : base.stroke,
    text: typeof raw.text === "string" ? raw.text.slice(0, 120) : "",
    ...(raw.kind === "polygon" ? { points: Array.isArray(raw.points) && raw.points.length >= 3 && raw.points.length <= 20 && raw.points.every((point) => point && typeof point === "object" && Number.isFinite(point.x) && Number.isFinite(point.y))
      ? raw.points.map((point: DrawingPoint) => ({ x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) })) : base.points } : {}),
    hatch: raw.hatch === true,
    dashed: raw.dashed === true,
    swing: raw.swing === "right" ? "right" : "left",
    doorStyle: raw.doorStyle === "double" ? "double" : "single",
    stairsStyle: raw.stairsStyle === "l" || raw.stairsStyle === "u" ? raw.stairsStyle : "straight",
  };
}

export function normalizeDrawings(value: unknown): DrawingDocument[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: DrawingDocument[] = [];
  for (const raw of value.slice(0, 100)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id || item.id.length > 100 || seen.has(item.id) || !drawingTypes.includes(item.type as DrawingType)) continue;
    seen.add(item.id);
    const elementIds = new Set<string>();
    const elements = Array.isArray(item.elements) ? item.elements.slice(0, 300).map(normalizeDrawingElement).filter((entry): entry is DrawingElement => {
      if (!entry || elementIds.has(entry.id)) return false;
      elementIds.add(entry.id);
      return true;
    }) : [];
    result.push({
      id: item.id,
      type: item.type as DrawingType,
      title: typeof item.title === "string" ? item.title.slice(0, 100) : drawingLabels[item.type as DrawingType],
      elements,
      includeInReport: item.includeInReport === true,
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : "",
    });
  }
  return result;
}

export function moveElement(elements: DrawingElement[], id: string, direction: "up" | "down"): DrawingElement[] {
  const index = elements.findIndex((entry) => entry.id === id);
  const nextIndex = index + (direction === "up" ? 1 : -1);
  if (index < 0 || nextIndex < 0 || nextIndex >= elements.length) return elements;
  const result = [...elements];
  [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  return result;
}
