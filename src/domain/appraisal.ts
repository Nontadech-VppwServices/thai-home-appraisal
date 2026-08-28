export type JobStatus = "draft" | "saved" | "reviewPending" | "approved" | "changesRequested";
export type ValuationMethod = "manual" | "area" | "compare";

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
  checks: boolean[];
  createdAt: string;
  updatedAt: string;
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
  "ที่ดินพร้อมสิ่งปลูกสร้าง",
];

export const conditionOptions = ["ดีมาก", "ดี", "พอใช้", "ต้องปรับปรุง"];

export const checklistItems = [
  "ระบุที่อยู่และข้อมูลพื้นที่ครบถ้วน",
  "แนบรูปภายนอกและภายในบ้าน",
  "ระบุวิธีและเหตุผลของราคา",
  "ตรวจสอบเอกสารสิทธิ์แล้ว",
  "รับทราบว่าต้นแบบยังไม่ส่งข้อมูลจริงไปธนาคาร",
];

export const nextPhaseRequirements = [
  {
    id: "REQ-REVIEW-001",
    title: "ผู้ตรวจสอบขอแก้ไขหรืออนุมัติงาน",
    route: "review",
    missing: "ต้องยืนยัน role ผู้ตรวจสอบ ผู้อนุมัติ และรูปแบบประวัติสถานะก่อนเปิดใช้งานจริง",
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
    title: "Login, role-based access, audit log, encryption และ retention",
    route: "security",
    missing: "ต้องทำ threat/privacy review และกำหนดนโยบาย PDPA ก่อน production",
  },
] as const;

export function createEmptyJob(id: string, today: string): AppraisalJob {
  return {
    id,
    status: "draft",
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
    checks: checklistItems.map(() => false),
    createdAt: today,
    updatedAt: today,
  };
}

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
