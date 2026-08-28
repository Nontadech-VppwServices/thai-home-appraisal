import type { Team } from "./access";
import { normalizeSelectedReferences, type SelectedPriceReference } from "./priceReferences";

/**
 * สถานะงานตาม REQ-PIPELINE-005 (docs/requirements/pipeline.md)
 * ห้ามเพิ่ม/ลบค่าโดยไม่แก้ requirement doc ก่อน
 */
export type JobStatus = "intake" | "assigned" | "readyToSubmit" | "changesRequested" | "submitted";

export type ValuationMethod = "manual" | "area" | "compare";

export const jobStatuses: JobStatus[] = [
  "intake",
  "assigned",
  "changesRequested",
  "readyToSubmit",
  "submitted",
];

export const statusLabels: Record<JobStatus, string> = {
  intake: "รอมอบหมาย",
  assigned: "รอลงพื้นที่",
  readyToSubmit: "รอส่งธนาคาร",
  changesRequested: "ขอแก้ไข",
  submitted: "ส่งธนาคารแล้ว",
};

/** ทีมที่ถืองานอยู่ในแต่ละสถานะ ตามตารางภาพรวมสายงานใน pipeline.md */
export const statusOwners: Record<JobStatus, Team | null> = {
  intake: "teamA",
  assigned: "teamB",
  changesRequested: "teamB",
  readyToSubmit: "teamC",
  submitted: null,
};

/** ลำดับสถานะที่อนุญาต ข้ามขั้นไม่ได้ และ submitted เป็นปลายทาง */
export const statusFlow: Record<JobStatus, JobStatus[]> = {
  intake: ["assigned"],
  assigned: ["readyToSubmit"],
  readyToSubmit: ["submitted", "changesRequested"],
  changesRequested: ["readyToSubmit"],
  submitted: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return statusFlow[from].includes(to);
}

export function ownerTeamOf(status: JobStatus): Team | null {
  return statusOwners[status];
}

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && (jobStatuses as string[]).includes(value);
}

/** ประวัติการเปลี่ยนสถานะตาม REQ-PIPELINE-005 */
export type StatusChange = {
  /** null = รายการแรกตอนรับงานเข้าระบบ */
  from: JobStatus | null;
  to: JobStatus;
  actor: Team;
  /** ISO timestamp เต็ม ต่างจาก receivedAt/dueDate ที่เป็นวันที่อย่างเดียว */
  at: string;
  note: string;
};

export type WorkflowInfo = {
  caseId: string;
  visitDate: string;
  clientName: string;
  bank: string;
};

export type PropertyInfo = {
  address: string;
  latitude: string;
  longitude: string;
  propertyType: string;
  condition: string;
  landArea: number;
  usableArea: number;
  floors: number;
  buildYear: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
};

export type PhotoEvidence = {
  id: string;
  name: string;
  dataUrl: string;
};

export type ValuationInput = {
  method: ValuationMethod;
  manualPrice: number;
  rate: number;
  comparePrice: number;
};

export type ValuationResult = {
  method: ValuationMethod;
  price: number;
  basis: string;
};

export type AppraisalJob = {
  id: string;
  status: JobStatus;
  workflow: WorkflowInfo;
  property: PropertyInfo;
  photos: PhotoEvidence[];
  valuation: ValuationInput;
  /** ความสัมพันธ์ไปยัง snapshot ในคลังราคา พร้อมเหตุผลที่ทีม B เลือก */
  selectedReferences: SelectedPriceReference[];
  checks: boolean[];
  createdAt: string;
  updatedAt: string;
  /** "YYYY-MM-DD" วันที่รับงานจากธนาคาร (REQ-PIPELINE-001) */
  receivedAt: string;
  /** "YYYY-MM-DD" กำหนดส่งงาน หรือ "" เมื่อยังไม่กำหนด */
  dueDate: string;
  /** ผู้ประเมินของทีม B หรือ "" เมื่อยังไม่มอบหมาย (REQ-PIPELINE-002) */
  assignee: string;
  /** เรียงเก่า -> ใหม่ มีอย่างน้อย 1 รายการเสมอ */
  statusHistory: StatusChange[];
};

export const bankOptions = [
  "ธนาคารกรุงเทพ",
  "ธนาคารกสิกรไทย",
  "ธนาคารกรุงไทย",
  "ธนาคารไทยพาณิชย์",
  "อื่น ๆ / ยังไม่ระบุ",
];

export const propertyTypeOptions = [
  "บ้านเดี่ยว",
  "บ้านแฝด",
  "ทาวน์เฮาส์",
  "อาคารพาณิชย์",
  "อาคารทั่วไป",
  "โรงงาน / โกดัง",
  "ที่ดินเปล่า",
  "ที่ดินพร้อมสิ่งปลูกสร้าง",
];

export const conditionOptions = ["ดีมาก", "ดี", "พอใช้", "ต้องปรับปรุง"];

export const checklistItems = [
  "ระบุที่อยู่และข้อมูลพื้นที่ครบถ้วน",
  "แนบรูปภายนอกและภายในบ้าน",
  "ระบุวิธีและเหตุผลของราคา",
  "ตรวจข้อมูลอ้างอิงราคา หรือรับทราบว่าไม่พบข้อมูล",
  "ตรวจสอบเอกสารสิทธิ์แล้ว",
  "รับทราบว่าต้นแบบยังไม่ส่งข้อมูลจริงไปธนาคาร",
];

export const nextPhaseRequirements = [
  {
    id: "REQ-PIPELINE-001",
    title: "ทีม A รับงานจากธนาคารเข้าระบบ",
    route: "intake",
    missing: "ต้องมี login และ role ทีม A รวมถึงยืนยันฟิลด์อ้างอิงของแต่ละธนาคารก่อนเปิดใช้งานจริง",
  },
  {
    id: "REQ-PIPELINE-004",
    title: "ทีม C ส่งผลประเมินกลับธนาคาร",
    route: "handoff",
    missing: "ต้องยืนยันช่องทางส่งงานของแต่ละธนาคารและข้อมูลตอบกลับ ก่อนบันทึกผลการส่งจริง",
  },
  {
    id: "REQ-REVIEW-001",
    title: "ผู้ตรวจสอบขอแก้ไขหรืออนุมัติงาน",
    route: "review",
    missing: "ต้องยืนยัน role ผู้ตรวจสอบ ผู้อนุมัติ และลำดับสถานะกับประวัติตาม REQ-PIPELINE-005 ก่อนเปิดใช้งานจริง",
  },
  {
    id: "REQ-EXPORT-001",
    title: "ส่งออก Excel/CSV ตาม schema ของธนาคาร",
    route: "export",
    missing: "ต้องได้รับ schema ของแต่ละธนาคารก่อนสร้างไฟล์ส่งออกจริง",
  },
  {
    id: "REQ-INTEGRATION-001",
    title: "ส่งข้อมูลผ่าน API ของแต่ละธนาคาร",
    route: "integration",
    missing: "ต้องมี sandbox, API contract, authentication และการติดตามผลก่อนเชื่อมต่อจริง",
  },
  {
    id: "REQ-SECURITY-001",
    title: "Login, บทบาททีม A/B/C, audit log, encryption และ retention",
    route: "security",
    missing: "ต้องทำ threat/privacy review กำหนดนโยบาย PDPA และยืนยันตารางสิทธิ์ตาม REQ-ROLE-001 ก่อน production",
  },
] as const;

export function createEmptyJob(id: string, today: string): AppraisalJob {
  return {
    id,
    status: "intake",
    workflow: {
      caseId: "",
      visitDate: today,
      clientName: "",
      bank: "",
    },
    property: {
      address: "",
      latitude: "",
      longitude: "",
      propertyType: "บ้านเดี่ยว",
      condition: "ดี",
      landArea: 0,
      usableArea: 0,
      floors: 1,
      buildYear: 0,
      bedrooms: 0,
      bathrooms: 0,
      description: "",
    },
    photos: [],
    valuation: {
      method: "manual",
      manualPrice: 0,
      rate: 0,
      comparePrice: 0,
    },
    selectedReferences: [],
    checks: checklistItems.map(() => false),
    createdAt: today,
    updatedAt: today,
    receivedAt: today,
    dueDate: "",
    assignee: "",
    statusHistory: [
      { from: null, to: "intake", actor: "teamA", at: `${today}T00:00:00.000Z`, note: "รับงานเข้าระบบ" },
    ],
  };
}

/* --------------------------------------------------------------------------
   การแปลงข้อมูลเก่าจาก localStorage
   เป็น pure function เพื่อทดสอบได้โดยไม่ต้องมี window และเรียกซ้ำได้ผลเดิม
-------------------------------------------------------------------------- */

/** สถานะรุ่นก่อน REQ-PIPELINE-005 ที่ยังค้างอยู่ในเครื่องผู้ใช้ */
const legacyStatusMap: Record<string, JobStatus> = {
  draft: "intake",
  saved: "intake",
  reviewPending: "readyToSubmit",
  approved: "submitted",
};

export function normalizeStoredJob(raw: unknown, fallbackToday: string): AppraisalJob | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || raw.id === "") return null;

  const createdAt = isDateOnly(raw.createdAt) ? raw.createdAt : fallbackToday;
  const base = createEmptyJob(raw.id, createdAt);
  const status = migrateStatus(raw.status);
  const receivedAt = isDateOnly(raw.receivedAt) ? raw.receivedAt : createdAt;

  return {
    ...base,
    status,
    workflow: { ...base.workflow, ...(asRecord(raw.workflow) as Partial<WorkflowInfo>) },
    property: { ...base.property, ...(asRecord(raw.property) as Partial<PropertyInfo>) },
    photos: Array.isArray(raw.photos) ? (raw.photos as PhotoEvidence[]) : base.photos,
    valuation: { ...base.valuation, ...(asRecord(raw.valuation) as Partial<ValuationInput>) },
    selectedReferences: normalizeSelectedReferences(raw.selectedReferences),
    checks: normalizeChecklistState(raw.checks) ?? base.checks,
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" && raw.updatedAt !== "" ? raw.updatedAt : createdAt,
    receivedAt,
    dueDate: isDateOnly(raw.dueDate) ? raw.dueDate : "",
    assignee: typeof raw.assignee === "string" ? raw.assignee : "",
    statusHistory: migrateHistory(raw.statusHistory, status, receivedAt),
  };
}

export function normalizeChecklistState(value: unknown): boolean[] | null {
  if (!Array.isArray(value)) return null;
  // รุ่น 0.4 มี 5 ช่อง ก่อนแทรก checklist ข้อมูลอ้างอิงที่ตำแหน่ง 4
  if (value.length === 5) {
    return [value[0] === true, value[1] === true, value[2] === true, false, value[3] === true, value[4] === true];
  }
  return checklistItems.map((_, index) => value[index] === true);
}

function migrateStatus(value: unknown): JobStatus {
  if (isJobStatus(value)) return value;
  if (typeof value === "string" && legacyStatusMap[value]) return legacyStatusMap[value];
  return "intake";
}

function migrateHistory(value: unknown, status: JobStatus, receivedAt: string): StatusChange[] {
  const entries = Array.isArray(value) ? value.filter(isStatusChange) : [];
  if (entries.length > 0) return entries;
  return [
    {
      from: null,
      to: status,
      actor: "admin",
      at: `${receivedAt}T00:00:00.000Z`,
      note: "ปรับข้อมูลเดิมเข้าสถานะใหม่อัตโนมัติ",
    },
  ];
}

function isStatusChange(value: unknown): value is StatusChange {
  if (!isRecord(value)) return false;
  return (
    (value.from === null || isJobStatus(value.from)) &&
    isJobStatus(value.to) &&
    typeof value.actor === "string" &&
    typeof value.at === "string" &&
    value.at !== "" &&
    typeof value.note === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/* --------------------------------------------------------------------------
   การคำนวณราคา
-------------------------------------------------------------------------- */

export function calculateValuation(property: PropertyInfo, valuation: ValuationInput): ValuationResult {
  if (valuation.method === "area") {
    const price = positiveNumber(property.usableArea) * positiveNumber(valuation.rate);
    return {
      method: valuation.method,
      price,
      basis: `${formatNumber(property.usableArea)} ตร.ม. x ${formatNumber(valuation.rate)} บาท`,
    };
  }

  if (valuation.method === "compare") {
    return {
      method: valuation.method,
      price: positiveNumber(valuation.comparePrice),
      basis: "อ้างอิงจากทรัพย์เปรียบเทียบ",
    };
  }

  return {
    method: valuation.method,
    price: positiveNumber(valuation.manualPrice),
    basis: "ผู้ประเมินกรอกมูลค่าเอง",
  };
}

export function formatMoney(value: number): string {
  return value > 0 ? `${formatNumber(value)} บาท` : "ยังไม่ระบุ";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(positiveNumber(value));
}

export function positiveNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
