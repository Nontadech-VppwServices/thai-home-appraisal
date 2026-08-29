/**
 * ข้อมูลตัวอย่างสำหรับ demo หน้ารายงานภาพรวม (REQ-INSIGHT-006)
 *
 * เป็น pure function และใช้ RNG ที่กำหนด seed ได้ ผลลัพธ์จึงซ้ำเดิมทุกครั้ง
 * งานที่สร้างจากที่นี่ลงใน store เดียวกับงานจริง จึงใช้ id ขึ้นต้นด้วย `demo-`
 * เพื่อให้ล้างทีหลังได้โดยไม่แตะงานจริง
 */

import type { Team } from "./access";
import {
  bankOptions,
  conditionOptions,
  createEmptyJob,
  ownerTeamOf,
  propertyTypeOptions,
  statusLabels,
  type AppraisalJob,
  type JobStatus,
  type StatusChange,
} from "./appraisal";

export const demoIdPrefix = "demo-";
export const demoJobCount = 36;
const defaultSeed = 20260828;

export function isDemoJob(job: AppraisalJob): boolean {
  return job.id.startsWith(demoIdPrefix);
}

/** น้ำหนักสถานะปลายทาง ให้สัดส่วนใกล้เคียงงานจริงที่มีทั้งงานปิดและงานค้าง */
const statusWeights: { status: JobStatus; weight: number }[] = [
  { status: "submitted", weight: 55 },
  { status: "assigned", weight: 15 },
  { status: "readyToSubmit", weight: 12 },
  { status: "intake", weight: 10 },
  { status: "changesRequested", weight: 8 },
];

/**
 * ช่วงเวลาที่ใช้ในแต่ละขั้นตอน (วัน)
 * `assigned` ถูกตั้งให้ช้ากว่าเพื่อนโดยตั้งใจ เพื่อให้กราฟคอขวดมีอะไรให้ดู
 */
const stageDurationRange: Record<JobStatus, [number, number]> = {
  intake: [0.3, 2.5],
  assigned: [1.5, 9],
  readyToSubmit: [0.4, 3],
  changesRequested: [0.5, 3.5],
  submitted: [0, 0],
};

const assignees = [
  "สมชาย ใจดี",
  "ปิยะ วงศ์ทอง",
  "นภา ศรีสุข",
  "ธนกร แก้วมณี",
  "อารีย์ พงษ์พันธ์",
  "วรรณา อินทร์แก้ว",
];

const clients = [
  "คุณกิตติ ธนาวัฒน์",
  "คุณมาลี สุขเกษม",
  "คุณประเสริฐ ทองดี",
  "คุณสุดา บุญมี",
  "คุณอนันต์ รุ่งเรือง",
  "คุณพรทิพย์ ชัยมงคล",
  "คุณวิชัย เจริญสุข",
  "คุณรัตนา แสงทอง",
];

const addresses = [
  "99/12 ซอยลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ",
  "45/8 หมู่ 4 ต.บางรักพัฒนา อ.บางบัวทอง จ.นนทบุรี",
  "168 ถนนพระราม 2 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพฯ",
  "7/155 หมู่ 9 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ",
  "212 ถนนเชียงใหม่-ลำปาง ต.ช้างเผือก อ.เมือง จ.เชียงใหม่",
  "88/3 หมู่ 2 ต.หนองปรือ อ.บางละมุง จ.ชลบุรี",
];

const transitionNotes: Record<JobStatus, string> = {
  intake: "รับงานเข้าระบบ",
  assigned: "มอบหมายผู้ประเมินและนัดวันลงพื้นที่",
  readyToSubmit: "ประเมินหน้างานเสร็จ ส่งให้ทีม C ตรวจ",
  changesRequested: "ข้อมูลไม่ครบ ตีกลับให้ทีม B แก้ไข",
  submitted: "ส่งผลประเมินกลับธนาคารแล้ว",
};

export function createDemoJobs(options: { today: string; count?: number; seed?: number }): AppraisalJob[] {
  const count = options.count ?? demoJobCount;
  const random = mulberry32(options.seed ?? defaultSeed);
  const jobs: AppraisalJob[] = [];

  for (let index = 0; index < count; index += 1) {
    jobs.push(createDemoJob(index, options.today, random));
  }
  return jobs;
}

function createDemoJob(index: number, today: string, random: () => number): AppraisalJob {
  const target = pickWeighted(statusWeights, random);
  const bounced = target !== "intake" && target !== "assigned" && target !== "changesRequested" && random() < 0.15;
  const path = statusPath(target, bounced);

  // ทุกขั้นตอนยกเว้นขั้นสุดท้ายจบไปแล้ว ขั้นสุดท้ายคือเวลาที่งานค้างอยู่ตอนนี้
  const durations = path.slice(0, -1).map((status) => between(stageDurationRange[status], random));
  const trailingDays =
    target === "submitted" ? between([0, 200], random) : between([0.2, 12], random);
  const startedDaysAgo = Math.ceil(sum(durations) + trailingDays);

  const receivedAt = shiftDate(today, -startedDaysAgo);
  const statusHistory = buildHistory(path, durations, receivedAt);
  const lastChange = statusHistory[statusHistory.length - 1];

  const job = createEmptyJob(`${demoIdPrefix}${String(index + 1).padStart(4, "0")}`, receivedAt);
  job.status = lastChange.to;
  job.statusHistory = statusHistory;
  job.receivedAt = receivedAt;
  job.dueDate = shiftDate(receivedAt, Math.round(between([7, 14], random)));
  job.assignee = path.length > 1 ? pick(assignees, random) : "";
  job.createdAt = receivedAt;
  job.updatedAt = lastChange.at;

  job.workflow = {
    caseId: `AP-${receivedAt.slice(0, 4)}-${String(index + 1).padStart(4, "0")}`,
    visitDate: shiftDate(receivedAt, Math.round(between([1, 6], random))),
    clientName: pick(clients, random),
    bank: pick(bankOptions, random),
    siteContactName: "ผู้ติดต่อหน้างาน",
    siteContactPhone: "080-000-0000",
  };

  const usableArea = Math.round(between([48, 320], random));
  job.property = {
    ...job.property,
    address: pick(addresses, random),
    propertyType: pick(propertyTypeOptions, random),
    condition: pick(conditionOptions, random),
    landArea: Math.round(between([40, 180], random)),
    usableArea,
    floors: Math.round(between([1, 3], random)),
    buildYear: Math.round(between([2540, 2566], random)),
    bedrooms: Math.round(between([2, 5], random)),
    bathrooms: Math.round(between([1, 4], random)),
    description: "ข้อมูลตัวอย่างสำหรับ demo ไม่ใช่ทรัพย์จริง",
  };
  job.valuation = { ...job.valuation, method: "manual", manualPrice: Math.round(between([1_500_000, 8_000_000], random) / 10_000) * 10_000 };

  // รูปถ่ายเป็น base64 ขนาดใหญ่ ข้อมูลตัวอย่าง 36 ใบจะทะลุโควตา localStorage
  job.photos = [];
  return job;
}

/** เส้นทางสถานะที่ถูกต้องตาม statusFlow ห้ามข้ามขั้น */
function statusPath(target: JobStatus, bounced: boolean): JobStatus[] {
  const path: JobStatus[] = ["intake"];
  if (target === "intake") return path;

  path.push("assigned");
  if (target === "assigned") return path;

  path.push("readyToSubmit");
  if (target === "changesRequested") {
    path.push("changesRequested");
    return path;
  }
  if (bounced) path.push("changesRequested", "readyToSubmit");
  if (target === "submitted") path.push("submitted");
  return path;
}

function buildHistory(path: JobStatus[], durations: number[], receivedAt: string): StatusChange[] {
  let at = Date.parse(`${receivedAt}T09:00:00.000Z`);
  const history: StatusChange[] = [
    { from: null, to: path[0], actor: "teamA", at: new Date(at).toISOString(), note: transitionNotes[path[0]] },
  ];

  for (let index = 1; index < path.length; index += 1) {
    at += durations[index - 1] * 86_400_000;
    const from = path[index - 1];
    history.push({
      from,
      to: path[index],
      // ทีมที่ถือสถานะเดิมคือคนที่ส่งงานต่อ
      actor: (ownerTeamOf(from) ?? "admin") as Team,
      at: new Date(at).toISOString(),
      note: transitionNotes[path[index]],
    });
  }
  return history;
}

/* --------------------------------------------------------------------------
   ตัวช่วยสุ่มแบบกำหนด seed ได้
-------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function between([min, max]: [number, number], random: () => number): number {
  return min + random() * (max - min);
}

function pick<Item>(items: Item[], random: () => number): Item {
  return items[Math.floor(random() * items.length)];
}

function pickWeighted(options: { status: JobStatus; weight: number }[], random: () => number): JobStatus {
  const total = options.reduce((acc, option) => acc + option.weight, 0);
  let ticket = random() * total;
  for (const option of options) {
    ticket -= option.weight;
    if (ticket <= 0) return option.status;
  }
  return options[options.length - 1].status;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function shiftDate(dateISO: string, days: number): string {
  return new Date(Date.parse(`${dateISO.slice(0, 10)}T00:00:00.000Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** ใช้ในข้อความยืนยันก่อนล้างข้อมูลตัวอย่าง */
export const demoStatusSummary = statusWeights.map(({ status }) => statusLabels[status]).join(" / ");
