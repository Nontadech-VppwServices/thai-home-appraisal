import { createEmptyJob, type AppraisalJob } from "@/domain/appraisal";

const STORAGE_KEY = "thaiHomeAppraisals:v1";
const LEGACY_STORAGE_KEY = "thaiHomeAppraisal";
const STORE_EVENT = "thai-home-appraisal-store-change";

type StoredJobs = Record<string, AppraisalJob>;

type StoredState = {
  jobs: StoredJobs;
  currentJobId: string | null;
};

const emptyState: StoredState = { jobs: {}, currentJobId: null };
let cachedRawValue: string | null = null;
let cachedStateValue: StoredState = emptyState;
let cachedListState: StoredState | null = null;
let cachedListValue: AppraisalJob[] = [];

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

export function saveJob(job: AppraisalJob): void {
  const state = readState();
  const now = new Date().toISOString();
  const nextJob = { ...job, status: "saved" as const, updatedAt: now };
  writeState({ jobs: { ...state.jobs, [job.id]: nextJob }, currentJobId: job.id });
}

export function saveDraft(job: AppraisalJob): void {
  const state = readState();
  const now = new Date().toISOString();
  const nextJob = { ...job, updatedAt: now };
  writeState({ jobs: { ...state.jobs, [job.id]: nextJob }, currentJobId: job.id });
}

export function removeJob(jobId: string): void {
  const state = readState();
  const jobs = { ...state.jobs };
  delete jobs[jobId];
  const currentJobId = state.currentJobId === jobId ? null : state.currentJobId;
  writeState({ jobs, currentJobId });
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
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(STORE_EVENT));
}

function parseState(value: string): StoredState {
  try {
    const parsed = JSON.parse(value) as StoredState;
    cachedRawValue = value;
    cachedStateValue = {
      jobs: parsed.jobs ?? {},
      currentJobId: parsed.currentJobId ?? null,
    };
    cachedListState = null;
    return cachedStateValue;
  } catch {
    cachedRawValue = value;
    cachedStateValue = emptyState;
    cachedListState = null;
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
    job.checks = legacy.checks ?? job.checks;
    job.photos = (legacy.photos ?? []).map((dataUrl, index) => ({
      id: `${job.id}-legacy-photo-${index}`,
      name: `รูปหลักฐาน ${index + 1}`,
      dataUrl,
    }));

    const state = { jobs: { [job.id]: job }, currentJobId: job.id };
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
