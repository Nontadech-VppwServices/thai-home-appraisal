/**
 * การคำนวณตัวเลขสำหรับหน้ารายงานภาพรวม (REQ-INSIGHT-002 ถึง REQ-INSIGHT-005)
 *
 * โมดูลนี้เป็น pure function ล้วน ไม่มี React ไม่มี window และไม่เรียก Date.now()
 * ผู้เรียกต้องส่ง `asOf` เข้ามาเสมอ เพื่อให้ผลลัพธ์ทดสอบซ้ำได้
 *
 * นิยาม cohort ที่ใช้ทั้งไฟล์:
 * - `งานเข้า` = งานที่ `receivedAt` อยู่ในช่วงที่เลือก
 * - `งานปิด`  = งานที่เวลาเข้าสถานะ `submitted` อยู่ในช่วงที่เลือก
 */

import { teamProfiles, type Team } from "./access";
import {
  calculateValuation,
  jobStatuses,
  ownerTeamOf,
  statusLabels,
  type AppraisalJob,
  type JobStatus,
} from "./appraisal";

const DAY_MS = 86_400_000;

/** ช่วงวันที่แบบ "YYYY-MM-DD" รวมปลายทั้งสองข้าง */
export type DateRange = { from: string; to: string };
export type RangePreset = "day" | "week" | "month" | "year" | "custom";
export type BucketSize = "day" | "week" | "month";
export type ReportFilter = { preset: RangePreset; range: DateRange };

export const rangePresets: RangePreset[] = ["day", "week", "month", "year", "custom"];

export const rangePresetLabels: Record<RangePreset, string> = {
  day: "วันนี้",
  week: "7 วัน",
  month: "30 วัน",
  year: "12 เดือน",
  custom: "กำหนดเอง",
};

export const bucketLabels: Record<BucketSize, string> = {
  day: "จัดกลุ่มรายวัน",
  week: "จัดกลุ่มรายสัปดาห์",
  month: "จัดกลุ่มรายเดือน",
};

/**
 * เป้าเวลาต่อขั้นตอน (วัน) — ยังเป็นค่าสมมติ รอยืนยันกับผู้ใช้งานจริง
 * ใช้เพื่อชี้ว่าขั้นตอนไหนช้ากว่าที่ควร ไม่ได้ใช้คำนวณ SLA ต่อธนาคาร
 */
export const stageTargetDays: Record<JobStatus, number> = {
  intake: 1,
  assigned: 3,
  changesRequested: 2,
  readyToSubmit: 2,
  submitted: 0,
};

/** งานที่ไม่มีความเคลื่อนไหวเกินจำนวนวันนี้ถือว่าค้าง (ค่าสมมติ รอยืนยัน) */
export const staleAfterDays = 5;

/* --------------------------------------------------------------------------
   วันที่ — คำนวณด้วย UTC ทั้งหมด
   ไทยคือ UTC+7 การใช้ new Date(y, m, d).toISOString() จะเลื่อนถอยไปหนึ่งวัน
-------------------------------------------------------------------------- */

/** ตัด ISO timestamp ให้เหลือเฉพาะวันที่ */
export function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function startOfDayMs(dateISO: string): number {
  return Date.parse(`${dateOnly(dateISO)}T00:00:00.000Z`);
}

function endOfDay(dateISO: string): string {
  return `${dateOnly(dateISO)}T23:59:59.999Z`;
}

export function addDays(dateISO: string, days: number): string {
  return new Date(startOfDayMs(dateISO) + days * DAY_MS).toISOString().slice(0, 10);
}

/** ผลต่างเป็นวันเต็ม ใช้กับค่าที่เป็นวันที่อย่างเดียว */
export function dayDiff(fromDate: string, toDate: string): number {
  return Math.round((startOfDayMs(toDate) - startOfDayMs(fromDate)) / DAY_MS);
}

/** ผลต่างเป็นวันแบบทศนิยม ใช้กับ ISO timestamp เต็ม */
export function daysBetween(fromISO: string, toISO: string): number {
  return (Date.parse(toISO) - Date.parse(fromISO)) / DAY_MS;
}

export function inRange(value: string, range: DateRange): boolean {
  const date = dateOnly(value);
  return date >= range.from && date <= range.to;
}

export function rangeLengthDays(range: DateRange): number {
  return dayDiff(range.from, range.to) + 1;
}

export function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(startOfDayMs(value));
}

/**
 * preset ทุกตัวเป็น "ช่วงย้อนหลังนับถึงวันนี้" ไม่ใช่ปฏิทิน
 * เพราะช่วงย้อนหลังมีข้อมูลเสมอ ส่วนเดือน/ปีปฏิทินอาจว่างในวันที่ 1
 */
export function resolveRange(preset: RangePreset, today: string, custom?: Partial<DateRange>): DateRange {
  if (preset === "custom") {
    const from = isDateOnly(custom?.from) ? custom.from : null;
    const to = isDateOnly(custom?.to) ? custom.to : null;
    if (!from || !to) return resolveRange("month", today);
    return from <= to ? { from, to } : { from: to, to: from };
  }

  const span: Record<Exclude<RangePreset, "custom">, number> = { day: 1, week: 7, month: 30, year: 365 };
  return { from: addDays(today, -(span[preset] - 1)), to: today };
}

/** ขนาดกลุ่มของกราฟแนวโน้ม กำหนดจากความยาวช่วง ไม่ให้ผู้ใช้เลือกเอง */
export function bucketSizeFor(range: DateRange): BucketSize {
  const length = rangeLengthDays(range);
  if (length <= 31) return "day";
  if (length <= 120) return "week";
  return "month";
}

/* --------------------------------------------------------------------------
   อ่านประวัติของงานหนึ่งใบ
-------------------------------------------------------------------------- */

function firstMoveAt(job: AppraisalJob): string {
  return job.statusHistory[0]?.at ?? `${job.receivedAt}T00:00:00.000Z`;
}

/** เวลาที่งานเข้าสถานะ ส่งธนาคารแล้ว (ครั้งล่าสุด) หรือ null เมื่อยังไม่ปิด */
export function submittedAtOf(job: AppraisalJob): string | null {
  for (let index = job.statusHistory.length - 1; index >= 0; index -= 1) {
    if (job.statusHistory[index].to === "submitted") return job.statusHistory[index].at;
  }
  return null;
}

/** เวลาที่งานเข้าสถานะปัจจุบัน ใช้วัดว่าค้างในสถานะนี้มานานแค่ไหน */
export function enteredCurrentStatusAt(job: AppraisalJob): string {
  return job.statusHistory[job.statusHistory.length - 1]?.at ?? firstMoveAt(job);
}

/**
 * ความเคลื่อนไหวล่าสุดของงาน นับทั้งการเปลี่ยนสถานะและการแก้ไขข้อมูล
 * งานที่ทีมยังแก้ข้อมูลอยู่ไม่ควรถูกนับว่าค้าง
 */
export function lastMovedAt(job: AppraisalJob): string {
  const entered = enteredCurrentStatusAt(job);
  return job.updatedAt > entered ? job.updatedAt : entered;
}

/** จำนวนวันตั้งแต่รับงานจนส่งธนาคาร หรือ null เมื่อยังไม่ปิด */
export function cycleDaysOf(job: AppraisalJob): number | null {
  const submittedAt = submittedAtOf(job);
  return submittedAt === null ? null : daysBetween(firstMoveAt(job), submittedAt);
}

export type StageEntry = {
  status: JobStatus;
  team: Team | null;
  start: string;
  end: string;
  days: number;
  /** true = ยังอยู่ในขั้นตอนนี้ ค่าที่ได้จึงเป็นค่าต่ำกว่าความจริง */
  open: boolean;
};

/**
 * ช่วงเวลาที่งานอยู่ในแต่ละขั้นตอน
 * งานที่ถูกตีกลับจะเข้าขั้นตอนเดิมซ้ำได้ จึงคืนเป็น list ไม่ใช่ map
 * สถานะ submitted เป็นปลายทาง ไม่นับเป็นขั้นตอนที่ใช้เวลา
 */
export function stageEntries(job: AppraisalJob, asOf: string): StageEntry[] {
  const history = job.statusHistory;
  const openEnd = endOfDay(asOf);
  const entries: StageEntry[] = [];

  for (let index = 0; index < history.length; index += 1) {
    const status = history[index].to;
    if (status === "submitted") continue;

    const start = history[index].at;
    const next = history[index + 1];
    const open = next === undefined;
    const end = open ? openEnd : next.at;

    entries.push({
      status,
      team: ownerTeamOf(status),
      start,
      end,
      days: Math.max(0, daysBetween(start, end)),
      open,
    });
  }

  return entries;
}

/* --------------------------------------------------------------------------
   สรุปต่อหนึ่งใบงาน
-------------------------------------------------------------------------- */

export type JobSummary = {
  id: string;
  caseId: string;
  clientName: string;
  bank: string;
  status: JobStatus;
  statusLabel: string;
  team: Team | null;
  teamLabel: string;
  assignee: string;
  receivedAt: string;
  dueDate: string;
  /** อยู่ในสถานะปัจจุบันมากี่วัน */
  ageInStatusDays: number;
  /** ไม่มีความเคลื่อนไหวมากี่วัน */
  idleDays: number;
  /** ตั้งแต่รับงานถึงวันปิด หรือถึงวันนี้เมื่อยังไม่ปิด */
  totalDays: number;
  /** มากกว่า 0 = เลยกำหนดส่ง 0 = ตรงเวลาหรือไม่ได้กำหนด */
  overdueDays: number;
  price: number;
};

export function summariseJob(job: AppraisalJob, asOf: string): JobSummary {
  const openEnd = endOfDay(asOf);
  const submittedAt = submittedAtOf(job);
  const team = ownerTeamOf(job.status);

  return {
    id: job.id,
    caseId: job.workflow.caseId,
    clientName: job.workflow.clientName,
    bank: job.workflow.bank,
    status: job.status,
    statusLabel: statusLabels[job.status],
    team,
    teamLabel: team ? teamProfiles[team].label : "—",
    assignee: job.assignee,
    receivedAt: job.receivedAt,
    dueDate: job.dueDate,
    ageInStatusDays: round1(Math.max(0, daysBetween(enteredCurrentStatusAt(job), openEnd))),
    idleDays: round1(Math.max(0, daysBetween(lastMovedAt(job), openEnd))),
    totalDays: round1(Math.max(0, cycleDaysOf(job) ?? daysBetween(firstMoveAt(job), openEnd))),
    overdueDays: overdueDaysOf(job, submittedAt, asOf),
    price: calculateValuation(job.property, job.valuation).price,
  };
}

function overdueDaysOf(job: AppraisalJob, submittedAt: string | null, asOf: string): number {
  if (job.dueDate === "") return 0;
  const reference = submittedAt === null ? asOf : dateOnly(submittedAt);
  return Math.max(0, dayDiff(job.dueDate, reference));
}

/* --------------------------------------------------------------------------
   งานค้าง — ตอบคำถาม "งานค้างที่ไหน" จึงไม่ผูกกับช่วงเวลาที่เลือก
-------------------------------------------------------------------------- */

export type WipStage = {
  status: JobStatus;
  statusLabel: string;
  team: Team | null;
  teamLabel: string;
  count: number;
  averageAgeDays: number;
  oldestDays: number;
};

export type WipReport = {
  openTotal: number;
  stages: WipStage[];
  overdue: JobSummary[];
  stale: JobSummary[];
  oldest: JobSummary[];
};

export function wipReport(jobs: AppraisalJob[], asOf: string): WipReport {
  const open = jobs.filter((job) => job.status !== "submitted").map((job) => summariseJob(job, asOf));

  const stages = openStatuses.map((status) => {
    const rows = open.filter((row) => row.status === status);
    const ages = rows.map((row) => row.ageInStatusDays);
    const team = ownerTeamOf(status);
    return {
      status,
      statusLabel: statusLabels[status],
      team,
      teamLabel: team ? teamProfiles[team].label : "—",
      count: rows.length,
      averageAgeDays: round1(average(ages)),
      oldestDays: round1(ages.length === 0 ? 0 : Math.max(...ages)),
    };
  });

  return {
    openTotal: open.length,
    stages,
    overdue: [...open].filter((row) => row.overdueDays > 0).sort((a, b) => b.overdueDays - a.overdueDays),
    stale: [...open].filter((row) => row.idleDays > staleAfterDays).sort((a, b) => b.idleDays - a.idleDays),
    oldest: [...open].sort((a, b) => b.totalDays - a.totalDays),
  };
}

const openStatuses = jobStatuses.filter((status) => status !== "submitted");

/* --------------------------------------------------------------------------
   เวลาต่อขั้นตอน — ตอบคำถาม "ช้าที่ไหน"
-------------------------------------------------------------------------- */

export type StageStat = {
  status: JobStatus;
  statusLabel: string;
  team: Team | null;
  teamLabel: string;
  entries: number;
  /** จำนวนช่วงที่ยังไม่จบ ค่าที่ได้จึงเป็นค่าต่ำกว่าความจริง */
  openEntries: number;
  averageDays: number;
  medianDays: number;
  p90Days: number;
  targetDays: number;
  overTarget: boolean;
};

/**
 * นับช่วงที่ "จบภายในช่วงที่เลือก" หรือ "ยังไม่จบและช่วงที่เลือกครอบคลุมวันนี้"
 * เงื่อนไขที่สองทำให้งานที่กำลังค้างอยู่ยังปรากฏในรายงาน
 */
export function stageStats(jobs: AppraisalJob[], range: DateRange, asOf: string): StageStat[] {
  const includeOpen = inRange(asOf, range);
  const selected: StageEntry[] = [];
  for (const job of jobs) {
    for (const entry of stageEntries(job, asOf)) {
      if (entry.open ? includeOpen : inRange(entry.end, range)) selected.push(entry);
    }
  }

  return openStatuses.map((status) => {
    const rows = selected.filter((entry) => entry.status === status);
    const days = rows.map((entry) => entry.days);
    const team = ownerTeamOf(status);
    const medianDays = round1(median(days));
    return {
      status,
      statusLabel: statusLabels[status],
      team,
      teamLabel: team ? teamProfiles[team].label : "—",
      entries: rows.length,
      openEntries: rows.filter((entry) => entry.open).length,
      averageDays: round1(average(days)),
      medianDays,
      p90Days: round1(percentile(days, 0.9)),
      targetDays: stageTargetDays[status],
      overTarget: rows.length > 0 && medianDays > stageTargetDays[status],
    };
  });
}

/* --------------------------------------------------------------------------
   เวลาต่อหนึ่งใบงาน — ตอบคำถาม "1 ใบงานใช้เวลากี่วัน"
-------------------------------------------------------------------------- */

const cycleBuckets = [
  { label: "0-3 วัน", max: 3 },
  { label: "4-7 วัน", max: 7 },
  { label: "8-14 วัน", max: 14 },
  { label: "15-30 วัน", max: 30 },
  { label: "เกิน 30 วัน", max: Infinity },
];

export type CycleTimeReport = {
  completed: number;
  averageDays: number;
  medianDays: number;
  p90Days: number;
  fastestDays: number;
  slowestDays: number;
  distribution: { label: string; count: number }[];
};

export function cycleTimeReport(jobs: AppraisalJob[], range: DateRange): CycleTimeReport {
  const days = completedInRange(jobs, range).map(({ cycleDays }) => cycleDays);

  return {
    completed: days.length,
    averageDays: round1(average(days)),
    medianDays: round1(median(days)),
    p90Days: round1(percentile(days, 0.9)),
    fastestDays: round1(days.length === 0 ? 0 : Math.min(...days)),
    slowestDays: round1(days.length === 0 ? 0 : Math.max(...days)),
    distribution: cycleBuckets.map(({ label, max }, index) => ({
      label,
      count: days.filter((value) => value <= max && (index === 0 || value > cycleBuckets[index - 1].max)).length,
    })),
  };
}

function completedInRange(jobs: AppraisalJob[], range: DateRange) {
  const rows: { job: AppraisalJob; submittedAt: string; cycleDays: number }[] = [];
  for (const job of jobs) {
    const submittedAt = submittedAtOf(job);
    if (submittedAt === null || !inRange(submittedAt, range)) continue;
    rows.push({ job, submittedAt, cycleDays: Math.max(0, daysBetween(firstMoveAt(job), submittedAt)) });
  }
  return rows;
}

/* --------------------------------------------------------------------------
   ผลงานรายทีม — ตอบคำถาม "แต่ละทีมจะทำเสร็จ"
-------------------------------------------------------------------------- */

export type TeamStat = {
  team: Team;
  label: string;
  duty: string;
  /** จำนวนครั้งที่ส่งงานต่อสำเร็จในช่วงที่เลือก */
  handoffs: number;
  averageHandlingDays: number;
  openJobs: number;
  overdueJobs: number;
  /** ประมาณการวันที่จะเคลียร์งานค้างหมด ด้วยความเร็วเดิม null = ยังไม่มีงานปิดให้คำนวณ */
  clearBacklogDays: number | null;
};

export const reportTeams: Team[] = ["teamA", "teamB", "teamC"];

export function teamStats(jobs: AppraisalJob[], range: DateRange, asOf: string): TeamStat[] {
  const closed: StageEntry[] = [];
  for (const job of jobs) {
    for (const entry of stageEntries(job, asOf)) {
      if (!entry.open && inRange(entry.end, range)) closed.push(entry);
    }
  }

  const open = jobs.filter((job) => job.status !== "submitted").map((job) => summariseJob(job, asOf));
  const days = rangeLengthDays(range);

  return reportTeams.map((team) => {
    const handled = closed.filter((entry) => entry.team === team);
    const openRows = open.filter((row) => row.team === team);
    const perDay = handled.length / days;

    return {
      team,
      label: teamProfiles[team].label,
      duty: teamProfiles[team].duty,
      handoffs: handled.length,
      averageHandlingDays: round1(average(handled.map((entry) => entry.days))),
      openJobs: openRows.length,
      overdueJobs: openRows.filter((row) => row.overdueDays > 0).length,
      clearBacklogDays: handled.length === 0 ? null : round1(openRows.length / perDay),
    };
  });
}

/* --------------------------------------------------------------------------
   แนวโน้มและอัตราส่วน
-------------------------------------------------------------------------- */

export type TrendPoint = { key: string; label: string; received: number; submitted: number };

export function trendSeries(jobs: AppraisalJob[], range: DateRange): TrendPoint[] {
  const bucket = bucketSizeFor(range);
  const points = bucketStarts(range, bucket).map((start) => ({
    key: start,
    label: bucketLabel(start, bucket),
    received: 0,
    submitted: 0,
  }));
  const indexOf = (date: string) => {
    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (date >= points[index].key) return index;
    }
    return -1;
  };

  for (const job of jobs) {
    if (inRange(job.receivedAt, range)) {
      const index = indexOf(job.receivedAt);
      if (index >= 0) points[index].received += 1;
    }
    const submittedAt = submittedAtOf(job);
    if (submittedAt !== null && inRange(submittedAt, range)) {
      const index = indexOf(dateOnly(submittedAt));
      if (index >= 0) points[index].submitted += 1;
    }
  }

  return points;
}

function bucketStarts(range: DateRange, bucket: BucketSize): string[] {
  const starts: string[] = [];
  if (bucket === "month") {
    let cursor = `${range.from.slice(0, 7)}-01`;
    while (cursor <= range.to) {
      starts.push(cursor < range.from ? range.from : cursor);
      const [year, month] = cursor.split("-").map(Number);
      cursor = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    }
    return starts;
  }

  const step = bucket === "week" ? 7 : 1;
  for (let cursor = range.from; cursor <= range.to; cursor = addDays(cursor, step)) starts.push(cursor);
  return starts;
}

function bucketLabel(start: string, bucket: BucketSize): string {
  const date = new Date(`${start}T00:00:00.000Z`);
  if (bucket === "month") {
    return new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date);
  }
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

export type RateReport = { hit: number; total: number; rate: number };

/** สัดส่วนงานปิดที่ส่งไม่เกินกำหนด งานที่ไม่ได้กำหนดวันส่งไม่ถูกนับ */
export function onTimeRate(jobs: AppraisalJob[], range: DateRange): RateReport {
  const rows = completedInRange(jobs, range).filter(({ job }) => job.dueDate !== "");
  const hit = rows.filter(({ job, submittedAt }) => dateOnly(submittedAt) <= job.dueDate).length;
  return { hit, total: rows.length, rate: safeRate(hit, rows.length) };
}

/** สัดส่วนงานเข้าที่เคยถูกตีกลับ ใช้เป็นสัญญาณคุณภาพงาน */
export function reworkRate(jobs: AppraisalJob[], range: DateRange): RateReport {
  const rows = jobs.filter((job) => inRange(job.receivedAt, range));
  const hit = rows.filter((job) => job.statusHistory.some((step) => step.to === "changesRequested")).length;
  return { hit, total: rows.length, rate: safeRate(hit, rows.length) };
}

export type BankRow = { bank: string; received: number; submitted: number; totalValue: number };

export function bankBreakdown(jobs: AppraisalJob[], range: DateRange): BankRow[] {
  const rows = new Map<string, BankRow>();
  const rowFor = (bank: string) => {
    const key = bank === "" ? "ยังไม่ระบุ" : bank;
    const existing = rows.get(key);
    if (existing) return existing;
    const created = { bank: key, received: 0, submitted: 0, totalValue: 0 };
    rows.set(key, created);
    return created;
  };

  for (const job of jobs) {
    if (inRange(job.receivedAt, range)) rowFor(job.workflow.bank).received += 1;
    const submittedAt = submittedAtOf(job);
    if (submittedAt !== null && inRange(submittedAt, range)) {
      const row = rowFor(job.workflow.bank);
      row.submitted += 1;
      row.totalValue += calculateValuation(job.property, job.valuation).price;
    }
  }

  return [...rows.values()].sort((a, b) => b.received - a.received || b.submitted - a.submitted);
}

/* --------------------------------------------------------------------------
   จุดเข้าเดียวที่ UI เรียก
-------------------------------------------------------------------------- */

export type DashboardReport = {
  range: DateRange;
  bucket: BucketSize;
  asOf: string;
  received: number;
  submitted: number;
  totalValue: number;
  wip: WipReport;
  stages: StageStat[];
  bottleneck: StageStat | null;
  cycle: CycleTimeReport;
  teams: TeamStat[];
  trend: TrendPoint[];
  onTime: RateReport;
  rework: RateReport;
  banks: BankRow[];
};

export function buildReport(jobs: AppraisalJob[], filter: ReportFilter, asOf: string): DashboardReport {
  const { range } = filter;
  const banks = bankBreakdown(jobs, range);
  const stages = stageStats(jobs, range, asOf);
  const measured = stages.filter((stage) => stage.entries > 0);

  return {
    range,
    bucket: bucketSizeFor(range),
    asOf,
    received: jobs.filter((job) => inRange(job.receivedAt, range)).length,
    submitted: completedInRange(jobs, range).length,
    totalValue: banks.reduce((sum, row) => sum + row.totalValue, 0),
    wip: wipReport(jobs, asOf),
    stages,
    bottleneck: measured.length === 0 ? null : measured.reduce((slowest, stage) => (stage.medianDays > slowest.medianDays ? stage : slowest)),
    cycle: cycleTimeReport(jobs, range),
    teams: teamStats(jobs, range, asOf),
    trend: trendSeries(jobs, range),
    onTime: onTimeRate(jobs, range),
    rework: reworkRate(jobs, range),
    banks,
  };
}

/* --------------------------------------------------------------------------
   ตัวช่วยเชิงตัวเลข — ทุกตัวคืน 0 บนชุดข้อมูลว่าง ไม่ใช่ NaN
-------------------------------------------------------------------------- */

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** nearest-rank percentile อ่านง่ายและไม่ต้อง interpolate */
function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil(fraction * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

function safeRate(hit: number, total: number): number {
  return total === 0 ? 0 : hit / total;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
