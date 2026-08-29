import { calculateValuation, createEmptyJob, normalizeChecklistState, normalizeStoredJob, type AppraisalJob } from "@/domain/appraisal";
import {
  normalizePriceReference,
  migrateLegacyComparablePrices,
  resolvePriceReferenceCapture,
  type PriceReferenceSnapshot,
} from "@/domain/priceReferences";
import type { Team } from "@/domain/access";

const STORAGE_KEY = "thaiHomeAppraisals:v1";
const LEGACY_STORAGE_KEY = "thaiHomeAppraisal";
const STORE_EVENT = "thai-home-appraisal-store-change";
const DEMO_SEED_KEY = "thaiHomeDemoSeeded:v1";

type StoredJobs = Record<string, AppraisalJob>;
type StoredReferences = Record<string, PriceReferenceSnapshot>;

type StoredState = {
  jobs: StoredJobs;
  references: StoredReferences;
  currentJobId: string | null;
};

const emptyState: StoredState = { jobs: {}, references: {}, currentJobId: null };
let cachedRawValue: string | null = null;
let cachedStateValue: StoredState = emptyState;
let cachedListState: StoredState | null = null;
let cachedListValue: AppraisalJob[] = [];
let cachedReferenceState: StoredState | null = null;
let cachedReferenceValue: PriceReferenceSnapshot[] = [];

/**
 * จำว่าเคยโหลดข้อมูลตัวอย่างในเบราว์เซอร์นี้ไปแล้วหรือยัง (REQ-INSIGHT-006)
 *
 * ถ้าไม่จำ หน้ารายงานจะ seed ใหม่ทุกครั้งที่คลังงานว่าง ทำให้ปุ่มล้างข้อมูลตัวอย่าง
 * ไม่มีผลจริง เก็บแยก key เพราะเป็นคนละเรื่องกับ schema ของงาน
 */
export function hasLoadedDemoBefore(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DEMO_SEED_KEY) === "1";
}

export function rememberDemoLoaded(): void {
  window.localStorage.setItem(DEMO_SEED_KEY, "1");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createLocalJobId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `job-${Date.now()}`;
}

export function createDraftJob(): AppraisalJob {
  return createEmptyJob(createLocalJobId(), todayISO());
}

export function listJobs(): AppraisalJob[] {
  const state = readState();
  if (cachedListState === state) return cachedListValue;
  cachedListState = state;
  cachedListValue = Object.values(state.jobs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return cachedListValue;
}

export function getJob(jobId: string): AppraisalJob | null {
  return readState().jobs[jobId] ?? null;
}

export function getCurrentJobId(): string | null {
  return readState().currentJobId;
}

/** คลัง snapshot กลางของ prototype (ยังจำกัดอยู่ใน browser เครื่องนี้) */
export function listPriceReferences(): PriceReferenceSnapshot[] {
  const state = readState();
  if (cachedReferenceState === state) return cachedReferenceValue;
  cachedReferenceState = state;
  cachedReferenceValue = Object.values(state.references).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  return cachedReferenceValue;
}

export function getSelectedPriceReferences(job: AppraisalJob): PriceReferenceSnapshot[] {
  const references = readState().references;
  return job.selectedReferences.flatMap((selection) => references[selection.referenceId] ?? []);
}

/**
 * บันทึก snapshot และผูกกับงานใน transaction เดียวของ localStorage
 * ถ้าพบ dedupe key เดิมจะ reuse snapshot เดิม ไม่สร้างสำเนาซ้ำ
 */
export function captureAndSelectPriceReference(
  jobId: string,
  snapshot: PriceReferenceSnapshot,
  selectedBy: Team,
  adjustmentNote = "",
): string {
  const state = readState();
  const job = state.jobs[jobId];
  if (!job) throw new Error("ไม่พบงานประเมิน");

  const reference = resolvePriceReferenceCapture(Object.values(state.references), snapshot);

  const alreadySelected = job.selectedReferences.some((item) => item.referenceId === reference.id);
  const now = new Date().toISOString();
  const selectedReferences = alreadySelected
    ? job.selectedReferences
    : [...job.selectedReferences, { referenceId: reference.id, selectedAt: now, selectedBy, adjustmentNote }];

  writeState({
    jobs: { ...state.jobs, [jobId]: { ...job, selectedReferences, updatedAt: now } },
    references: { ...state.references, [reference.id]: reference },
    currentJobId: jobId,
  });
  return reference.id;
}

export function updateSelectedReferenceNote(jobId: string, referenceId: string, adjustmentNote: string): void {
  const state = readState();
  const job = state.jobs[jobId];
  if (!job) return;
  const selectedReferences = job.selectedReferences.map((item) =>
    item.referenceId === referenceId ? { ...item, adjustmentNote } : item,
  );
  writeState({
    ...state,
    jobs: { ...state.jobs, [jobId]: { ...job, selectedReferences, updatedAt: new Date().toISOString() } },
    currentJobId: jobId,
  });
}

export function unselectPriceReference(jobId: string, referenceId: string): void {
  const state = readState();
  const job = state.jobs[jobId];
  if (!job) return;
  writeState({
    ...state,
    jobs: {
      ...state.jobs,
      [jobId]: {
        ...job,
        selectedReferences: job.selectedReferences.filter((item) => item.referenceId !== referenceId),
        updatedAt: new Date().toISOString(),
      },
    },
    currentJobId: jobId,
  });
}

/** สร้าง candidate จากผลประเมินเก่า โดยยังไม่บันทึกจนกว่าทีม B จะเลือก */
export function listInternalJobReferences(excludeJobId: string): PriceReferenceSnapshot[] {
  return listJobs().flatMap((job) => {
    if (job.id === excludeJobId || job.property.latitude === "" || job.property.longitude === "") return [];
    const price = calculateValuation(job.property, job.valuation).price;
    if (price <= 0) return [];
    const useUsableArea = job.property.usableArea > 0;
    return [{
      id: `internal-job-${job.id}-${job.updatedAt}`,
      revisionOf: null,
      sourceCategory: "internal" as const,
      providerName: "คลังงานประเมินของบริษัท",
      sourceUrl: `/jobs/${job.id}/report`,
      externalReference: job.workflow.caseId || job.id,
      originalJobId: job.id,
      propertyType: job.property.propertyType,
      address: job.property.address,
      latitude: job.property.latitude,
      longitude: job.property.longitude,
      totalPrice: price,
      unitPrice: useUsableArea ? price / job.property.usableArea : job.property.landArea > 0 ? price / job.property.landArea : 0,
      unit: useUsableArea ? "perSqM" as const : job.property.landArea > 0 ? "perSqWah" as const : "none" as const,
      landArea: job.property.landArea,
      usableArea: job.property.usableArea,
      observedAt: job.updatedAt.slice(0, 10),
      capturedAt: job.updatedAt.includes("T") ? job.updatedAt : `${job.updatedAt}T00:00:00.000Z`,
      capturedBy: "admin" as const,
    }];
  });
}

export function saveJob(job: AppraisalJob): void {
  const state = readState();
  const now = new Date().toISOString();
  const nextJob = { ...job, updatedAt: now };
  writeState({ ...state, jobs: { ...state.jobs, [job.id]: nextJob }, currentJobId: job.id });
}

export function removeJob(jobId: string): void {
  const state = readState();
  const jobs = { ...state.jobs };
  delete jobs[jobId];
  const currentJobId = state.currentJobId === jobId ? null : state.currentJobId;
  writeState({ ...state, jobs, currentJobId });
}

/** บันทึกหลายงานพร้อมกัน ใช้ตอนสร้างข้อมูลตัวอย่าง จึงไม่แตะ currentJobId */
export function saveJobs(jobs: AppraisalJob[]): void {
  const state = readState();
  const nextJobs = { ...state.jobs };
  for (const job of jobs) nextJobs[job.id] = job;
  writeState({ ...state, jobs: nextJobs, currentJobId: state.currentJobId });
}

/** ลบงานที่ตรงเงื่อนไข คืนจำนวนที่ลบ ใช้ล้างข้อมูลตัวอย่างโดยไม่แตะงานจริง */
export function removeJobs(predicate: (job: AppraisalJob) => boolean): number {
  const state = readState();
  const nextJobs: StoredJobs = {};
  let removed = 0;
  for (const job of Object.values(state.jobs)) {
    if (predicate(job)) removed += 1;
    else nextJobs[job.id] = job;
  }
  if (removed === 0) return 0;

  const currentJobId = state.currentJobId && nextJobs[state.currentJobId] ? state.currentJobId : null;
  writeState({ ...state, jobs: nextJobs, currentJobId });
  return removed;
}

export function subscribeToJobs(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

function readState(): StoredState {
  if (typeof window === "undefined") return emptyState;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === cachedRawValue) return cachedStateValue;
  if (stored) return parseState(stored);

  const legacy = migrateLegacyJob();
  if (legacy) return legacy;

  return emptyState;
}

function writeState(state: StoredState): void {
  const serialized = JSON.stringify(state);
  cachedRawValue = serialized;
  cachedStateValue = state;
  cachedListState = null;
  cachedReferenceState = null;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(STORE_EVENT));
}

/**
 * แปลงข้อมูลจาก localStorage ให้เป็น AppraisalJob ที่ครบตาม schema ปัจจุบัน
 * ทำที่นี่จุดเดียวเพราะรันครั้งเดียวต่อค่าดิบหนึ่งค่า แล้วผลถูกเก็บใน cachedStateValue
 * ห้ามย้ายไป listJobs/getJob เพราะจะสร้าง object ใหม่ทุกครั้งที่ useSyncExternalStore อ่าน snapshot
 * และห้ามเขียนกลับที่นี่ ค่าที่ซ่อมแล้วจะถูกบันทึกเองตอน save ครั้งถัดไป
 */
function normalizeJobs(raw: unknown): StoredJobs {
  if (typeof raw !== "object" || raw === null) return {};
  const today = todayISO();
  const jobs: StoredJobs = {};
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const job = normalizeStoredJob(value, today);
    if (job) jobs[job.id] = job;
  }
  return jobs;
}

function normalizeReferences(raw: unknown): StoredReferences {
  if (typeof raw !== "object" || raw === null) return {};
  const references: StoredReferences = {};
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const reference = normalizePriceReference(value);
    if (reference) references[reference.id] = reference;
  }
  return references;
}

function parseState(value: string): StoredState {
  try {
    const parsed = JSON.parse(value) as StoredState;
    cachedRawValue = value;
    const jobs = normalizeJobs(parsed.jobs);
    const references = normalizeReferences(parsed.references);
    migrateLegacyComparablePrices(jobs, references);
    cachedStateValue = {
      jobs,
      references,
      currentJobId: parsed.currentJobId ?? null,
    };
    cachedListState = null;
    cachedReferenceState = null;
    return cachedStateValue;
  } catch {
    cachedRawValue = value;
    cachedStateValue = emptyState;
    cachedListState = null;
    cachedReferenceState = null;
    return emptyState;
  }
}

function migrateLegacyJob(): StoredState | null {
  const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyValue) return null;

  try {
    const legacy = JSON.parse(legacyValue) as {
      fields?: Record<string, string>;
      price?: { method?: string; price?: number };
      checks?: boolean[];
      photos?: string[];
    };
    const job = createDraftJob();
    job.workflow = {
      caseId: legacy.fields?.caseId ?? "",
      visitDate: legacy.fields?.visitDate ?? todayISO(),
      clientName: legacy.fields?.clientName ?? "",
      bank: legacy.fields?.bank ?? "",
    };
    job.property = {
      address: legacy.fields?.address ?? "",
      latitude: legacy.fields?.latitude ?? "",
      longitude: legacy.fields?.longitude ?? "",
      propertyType: legacy.fields?.propertyType ?? "บ้านเดี่ยว",
      condition: legacy.fields?.condition ?? "ดี",
      landArea: numberField(legacy.fields?.landArea),
      usableArea: numberField(legacy.fields?.usableArea),
      floors: numberField(legacy.fields?.floors) || 1,
      buildYear: numberField(legacy.fields?.buildYear),
      bedrooms: numberField(legacy.fields?.bedrooms),
      bathrooms: numberField(legacy.fields?.bathrooms),
      description: legacy.fields?.description ?? "",
    };
    job.valuation = {
      method: legacy.price?.method === "area" || legacy.price?.method === "compare" ? legacy.price.method : "manual",
      manualPrice: numberField(legacy.fields?.manualPrice) || legacy.price?.price || 0,
      rate: numberField(legacy.fields?.rate),
      comparePrice: numberField(legacy.fields?.comparePrice),
    };
    job.checks = normalizeChecklistState(legacy.checks) ?? job.checks;
    job.photos = (legacy.photos ?? []).map((dataUrl, index) => ({
      id: `${job.id}-legacy-photo-${index}`,
      name: `รูปหลักฐาน ${index + 1}`,
      dataUrl,
    }));

    const state = { jobs: { [job.id]: job }, references: {}, currentJobId: job.id };
    writeState(state);
    return state;
  } catch {
    return null;
  }
}

function numberField(value: string | undefined): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
