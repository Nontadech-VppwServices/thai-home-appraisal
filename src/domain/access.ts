/**
 * สิทธิ์การเข้าถึงตามทีม
 *
 * ค่าตั้งต้นทั้งหมด derive มาจากตารางสิทธิ์ใน `REQ-ROLE-001`
 * (docs/requirements/pipeline.md) โดยตรง ห้ามแก้ค่าใน `defaultMatrix`
 * โดยไม่แก้ requirement doc ก่อน — `access.test.ts` ตรวจไว้แล้ว
 *
 * ข้อจำกัด: prototype นี้บังคับสิทธิ์ที่ฝั่ง client เท่านั้นเพื่อใช้ demo
 * ยังไม่ใช่การบังคับสิทธิ์จริงตามที่ `REQ-ROLE-001` กำหนด
 */

export type Team = "teamA" | "teamB" | "teamC" | "admin";

export type PermissionLevel = "none" | "read" | "edit";

export type MenuKey =
  | "jobs"
  | "newJob"
  | "insights"
  | "intake"
  | "workflow"
  | "property"
  | "photos"
  | "references"
  | "valuation"
  | "report"
  | "review"
  | "export"
  | "handoff"
  | "integration"
  | "security"
  | "permissions";

export type PermissionMatrix = Record<Team, Record<MenuKey, PermissionLevel>>;

export const teams: Team[] = ["teamA", "teamB", "teamC", "admin"];

export const teamProfiles: Record<Team, { label: string; short: string; duty: string; scope: string }> = {
  teamA: {
    label: "ทีม A",
    short: "A",
    duty: "รับงานจากธนาคารเข้าระบบ และมอบหมายให้ทีม B",
    scope: "แก้ข้อมูลอ้างอิงธนาคารและมอบหมายงานได้ ดูผลประเมินของทีม B ได้อย่างเดียว",
  },
  teamB: {
    label: "ทีม B",
    short: "B",
    duty: "ลงพื้นที่ประเมินบ้านจริงตามข้อมูลของทีม A",
    scope: "แก้ข้อมูลทรัพย์ รูปถ่าย ข้อมูลอ้างอิง และราคาได้ ส่วนข้อมูลจากทีม A อ่านได้อย่างเดียว",
  },
  teamC: {
    label: "ทีม C",
    short: "C",
    duty: "ตรวจความครบถ้วนแล้วนำผลส่งกลับธนาคาร",
    scope: "บันทึกการส่งธนาคารและตีกลับงานได้ ส่วนข้อมูลประเมินอ่านได้อย่างเดียว",
  },
  admin: {
    label: "ผู้ดูแลระบบ",
    short: "Admin",
    duty: "ดูแลระบบและกำหนดสิทธิ์ของแต่ละทีม",
    scope: "เข้าถึงได้ทุกเมนู และเป็นทีมเดียวที่ปรับตารางสิทธิ์ได้",
  },
};

export type MenuEntry = {
  key: MenuKey;
  label: string;
  /** เมนูระดับบนใช้ href ตรง ส่วนเมนูของงานใช้ segment ต่อท้าย /jobs/[jobId] */
  href?: string;
  segment?: string;
};

export const menuCatalog: MenuEntry[] = [
  { key: "jobs", label: "รายการประเมิน", href: "/" },
  { key: "newJob", label: "สร้างงาน", href: "/jobs/new" },
  { key: "insights", label: "รายงานภาพรวม", href: "/insights" },
  { key: "permissions", label: "กำหนดสิทธิ์", href: "/permissions" },
  { key: "security", label: "ความปลอดภัย", href: "/security" },
  { key: "intake", label: "รับงาน (ทีม A)", segment: "intake" },
  { key: "workflow", label: "ข้อมูลงาน", segment: "workflow" },
  { key: "property", label: "ทรัพย์สิน", segment: "property" },
  { key: "photos", label: "รูปถ่าย", segment: "photos" },
  { key: "references", label: "ข้อมูลอ้างอิงราคา", segment: "references" },
  { key: "valuation", label: "ประเมินราคา", segment: "valuation" },
  { key: "report", label: "รายงาน", segment: "report" },
  { key: "review", label: "ตรวจสอบ", segment: "review" },
  { key: "export", label: "ส่งออก", segment: "export" },
  { key: "handoff", label: "ส่งงานธนาคาร (ทีม C)", segment: "handoff" },
  { key: "integration", label: "เชื่อม API ธนาคาร", segment: "integration" },
];

export const defaultMatrix: PermissionMatrix = {
  // "บันทึกงานจากธนาคาร" + "มอบหมายงาน" + "ตีกลับงาน" = ได้
  // "แก้ข้อมูลทรัพย์ รูปถ่าย ราคา" + "บันทึกการส่งธนาคาร" = ไม่ได้
  teamA: {
    jobs: "read",
    newJob: "edit",
    insights: "none",
    intake: "edit",
    workflow: "edit",
    property: "read",
    photos: "read",
    references: "read",
    valuation: "read",
    report: "read",
    review: "edit",
    export: "read",
    handoff: "read",
    integration: "read",
    security: "read",
    permissions: "none",
  },
  // "แก้ข้อมูลทรัพย์ รูปถ่าย ราคา" = ได้อย่างเดียว
  // "ดูงานและรายงาน" = ได้ เฉพาะงานที่ได้รับมอบหมาย
  teamB: {
    jobs: "read",
    newJob: "none",
    insights: "none",
    intake: "read",
    workflow: "read",
    property: "edit",
    photos: "edit",
    references: "edit",
    valuation: "edit",
    report: "read",
    review: "read",
    export: "none",
    handoff: "read",
    integration: "none",
    security: "read",
    permissions: "none",
  },
  // "บันทึกการส่งธนาคาร" + "ตีกลับงาน" = ได้
  teamC: {
    jobs: "read",
    newJob: "none",
    insights: "none",
    intake: "read",
    workflow: "read",
    property: "read",
    photos: "read",
    references: "read",
    valuation: "read",
    report: "read",
    review: "edit",
    export: "edit",
    handoff: "edit",
    integration: "edit",
    security: "read",
    permissions: "none",
  },
  admin: {
    jobs: "edit",
    newJob: "edit",
    insights: "edit",
    intake: "edit",
    workflow: "edit",
    property: "edit",
    photos: "edit",
    references: "edit",
    valuation: "edit",
    report: "edit",
    review: "edit",
    export: "edit",
    handoff: "edit",
    integration: "edit",
    security: "edit",
    permissions: "edit",
  },
};

export const permissionLevels: PermissionLevel[] = ["none", "read", "edit"];

export const permissionLabels: Record<PermissionLevel, string> = {
  none: "ซ่อน",
  read: "อ่าน",
  edit: "แก้ไข",
};

export function canView(level: PermissionLevel): boolean {
  return level !== "none";
}

export function canEdit(level: PermissionLevel): boolean {
  return level === "edit";
}

export function permissionOf(matrix: PermissionMatrix, team: Team | null, menu: MenuKey): PermissionLevel {
  if (!team) return "none";
  return matrix[team]?.[menu] ?? "none";
}

/** ทีมที่ปกติเป็นเจ้าของเมนูนี้ ใช้บอกผู้ใช้ว่าทำไมถึงแก้ไม่ได้ */
export function ownerTeamLabel(menu: MenuKey): string | null {
  const owner = teams.find((team) => team !== "admin" && defaultMatrix[team][menu] === "edit");
  return owner ? teamProfiles[owner].label : null;
}

/** เติมค่าที่ขาดจาก defaultMatrix เผื่อ localStorage เก่าไม่มี key ใหม่ */
export function normalizeMatrix(value: Partial<PermissionMatrix> | null | undefined): PermissionMatrix {
  const result = {} as PermissionMatrix;
  for (const team of teams) {
    const stored = value?.[team];
    const levels = {} as Record<MenuKey, PermissionLevel>;
    for (const entry of menuCatalog) {
      const level = stored?.[entry.key];
      levels[entry.key] = permissionLevels.includes(level as PermissionLevel)
        ? (level as PermissionLevel)
        : defaultMatrix[team][entry.key];
    }
    result[team] = levels;
  }
  return result;
}

export function isTeam(value: unknown): value is Team {
  return typeof value === "string" && (teams as string[]).includes(value);
}
