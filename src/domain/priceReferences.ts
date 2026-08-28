import type { Team } from "./access";
import type { AppraisalJob } from "./appraisal";

export type PriceReferenceSource = "official" | "market" | "internal";
export type PriceReferenceUnit = "none" | "perSqWah" | "perSqM";
export type ReferenceSummaryUnit = "total" | Exclude<PriceReferenceUnit, "none">;

/**
 * สำเนาข้อมูลราคา ณ เวลาที่นำเข้า ใช้เป็นหลักฐานย้อนหลัง
 * เมื่อถูกบันทึกแล้วห้ามแก้ object เดิม การแก้ไขต้องสร้าง revision ใหม่
 */
export type PriceReferenceSnapshot = {
  id: string;
  revisionOf: string | null;
  sourceCategory: PriceReferenceSource;
  providerName: string;
  sourceUrl: string;
  externalReference: string;
  originalJobId: string;
  propertyType: string;
  address: string;
  latitude: string;
  longitude: string;
  totalPrice: number;
  unitPrice: number;
  unit: PriceReferenceUnit;
  landArea: number;
  usableArea: number;
  /** วันที่ประกาศ/วันที่ราคามีผล รูปแบบ YYYY-MM-DD */
  observedAt: string;
  /** เวลาที่คัดลอกข้อมูลเข้าระบบ รูปแบบ ISO timestamp */
  capturedAt: string;
  capturedBy: Team;
};

export type SelectedPriceReference = {
  referenceId: string;
  selectedAt: string;
  selectedBy: Team;
  adjustmentNote: string;
};

export type ReferenceSearchCriteria = {
  latitude: string;
  longitude: string;
  radiusKm: number;
  maxAgeMonths: number;
  propertyType: string;
  sourceCategory: PriceReferenceSource | "all";
};

export type ReferenceSearchResult = {
  reference: PriceReferenceSnapshot;
  distanceKm: number;
};

export type PriceReferenceSummary = {
  sourceCategory: PriceReferenceSource;
  unit: ReferenceSummaryUnit;
  count: number;
  minimum: number;
  median: number;
  maximum: number;
};

export const sourceLabels: Record<PriceReferenceSource, string> = {
  official: "ราคาประเมินภาครัฐ",
  market: "ราคาประกาศในตลาด",
  internal: "งานประเมินเดิมของบริษัท",
};

export const unitLabels: Record<ReferenceSummaryUnit, string> = {
  total: "ราคารวม",
  perSqWah: "บาท/ตร.ว.",
  perSqM: "บาท/ตร.ม.",
};

const sources: PriceReferenceSource[] = ["official", "market", "internal"];
const units: PriceReferenceUnit[] = ["none", "perSqWah", "perSqM"];

/** ใช้ provider + external id ก่อน และ fallback เป็น URL + ราคา + วันที่ */
export function priceReferenceDedupeKey(reference: PriceReferenceSnapshot): string {
  const provider = reference.providerName.trim().toLocaleLowerCase("th-TH");
  const external = reference.externalReference.trim().toLocaleLowerCase("th-TH");
  if (external) return `${provider}|external|${external}`;
  return [
    provider,
    "url",
    reference.sourceUrl.trim().toLocaleLowerCase("th-TH"),
    reference.totalPrice,
    reference.unitPrice,
    reference.unit,
    reference.observedAt,
  ].join("|");
}

/** คืน snapshot เดิมเมื่อซ้ำ และปฏิเสธการเขียนทับ id เดิมด้วยข้อมูลใหม่ */
export function resolvePriceReferenceCapture(
  existing: PriceReferenceSnapshot[],
  candidate: PriceReferenceSnapshot,
): PriceReferenceSnapshot {
  const duplicate = existing.find((reference) => priceReferenceDedupeKey(reference) === priceReferenceDedupeKey(candidate));
  if (duplicate) return duplicate;
  const sameId = existing.find((reference) => reference.id === candidate.id);
  if (sameId && JSON.stringify(sameId) !== JSON.stringify(candidate)) {
    throw new Error("snapshot เดิมแก้ไขไม่ได้ กรุณาสร้าง revision ใหม่");
  }
  return sameId ?? candidate;
}

export function createPriceReferenceRevision(
  original: PriceReferenceSnapshot,
  changes: Partial<Omit<PriceReferenceSnapshot, "id" | "revisionOf" | "capturedAt" | "capturedBy">>,
  revision: { id: string; capturedAt: string; capturedBy: Team },
): PriceReferenceSnapshot {
  return {
    ...original,
    ...changes,
    id: revision.id,
    revisionOf: original.id,
    capturedAt: revision.capturedAt,
    capturedBy: revision.capturedBy,
  };
}

export function searchPriceReferences(
  references: PriceReferenceSnapshot[],
  criteria: ReferenceSearchCriteria,
  asOf: string,
): ReferenceSearchResult[] {
  const origin = coordinates(criteria.latitude, criteria.longitude);
  if (!origin) return [];

  const radiusKm = positive(criteria.radiusKm) || 5;
  const maxAgeMonths = positive(criteria.maxAgeMonths) || 24;
  const oldestDate = subtractMonths(asOf.slice(0, 10), maxAgeMonths);

  return references
    .flatMap((reference) => {
      if (criteria.sourceCategory !== "all" && reference.sourceCategory !== criteria.sourceCategory) return [];
      if (criteria.propertyType && reference.propertyType !== criteria.propertyType) return [];
      if (!isDateOnly(reference.observedAt) || reference.observedAt < oldestDate || reference.observedAt > asOf.slice(0, 10)) {
        return [];
      }
      const point = coordinates(reference.latitude, reference.longitude);
      if (!point) return [];
      const distanceKm = haversineKm(origin.latitude, origin.longitude, point.latitude, point.longitude);
      return distanceKm <= radiusKm ? [{ reference, distanceKm }] : [];
    })
    .sort((left, right) => left.distanceKm - right.distanceKm || right.reference.observedAt.localeCompare(left.reference.observedAt));
}

/** สรุปแยก source และหน่วยเสมอ จึงไม่เฉลี่ยราคาคนละความหมายเข้าด้วยกัน */
export function summarizePriceReferences(references: PriceReferenceSnapshot[]): PriceReferenceSummary[] {
  const groups = new Map<string, { source: PriceReferenceSource; unit: ReferenceSummaryUnit; values: number[] }>();

  for (const reference of references) {
    if (positive(reference.totalPrice) > 0) addSummaryValue(groups, reference.sourceCategory, "total", reference.totalPrice);
    if (reference.unit !== "none" && positive(reference.unitPrice) > 0) {
      addSummaryValue(groups, reference.sourceCategory, reference.unit, reference.unitPrice);
    }
  }

  return [...groups.values()].map(({ source, unit, values }) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      sourceCategory: source,
      unit,
      count: sorted.length,
      minimum: sorted[0],
      median: median(sorted),
      maximum: sorted[sorted.length - 1],
    };
  });
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function normalizePriceReference(value: unknown): PriceReferenceSnapshot | null {
  if (!isRecord(value) || typeof value.id !== "string" || value.id === "") return null;
  if (!sources.includes(value.sourceCategory as PriceReferenceSource)) return null;

  return {
    id: value.id,
    revisionOf: typeof value.revisionOf === "string" && value.revisionOf ? value.revisionOf : null,
    sourceCategory: value.sourceCategory as PriceReferenceSource,
    providerName: stringValue(value.providerName),
    sourceUrl: stringValue(value.sourceUrl),
    externalReference: stringValue(value.externalReference),
    originalJobId: stringValue(value.originalJobId),
    propertyType: stringValue(value.propertyType),
    address: stringValue(value.address),
    latitude: stringValue(value.latitude),
    longitude: stringValue(value.longitude),
    totalPrice: numberValue(value.totalPrice),
    unitPrice: numberValue(value.unitPrice),
    unit: units.includes(value.unit as PriceReferenceUnit) ? (value.unit as PriceReferenceUnit) : "none",
    landArea: numberValue(value.landArea),
    usableArea: numberValue(value.usableArea),
    observedAt: isDateOnly(value.observedAt) ? value.observedAt : "",
    capturedAt: stringValue(value.capturedAt),
    capturedBy: isTeam(value.capturedBy) ? value.capturedBy : "admin",
  };
}

export function normalizeSelectedReferences(value: unknown): SelectedPriceReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.referenceId !== "string" || item.referenceId === "") return [];
    return [{
      referenceId: item.referenceId,
      selectedAt: stringValue(item.selectedAt),
      selectedBy: isTeam(item.selectedBy) ? item.selectedBy : "admin",
      adjustmentNote: stringValue(item.adjustmentNote),
    }];
  });
}

/** ย้าย comparePrice รุ่นเก่าเป็น snapshot แบบ deterministic ทำซ้ำแล้วไม่เกิดรายการเพิ่ม */
export function migrateLegacyComparablePrices(
  jobs: Record<string, AppraisalJob>,
  references: Record<string, PriceReferenceSnapshot>,
): void {
  for (const job of Object.values(jobs)) {
    if (job.valuation.comparePrice <= 0 || job.selectedReferences.length > 0) continue;
    const id = `legacy-compare-${job.id}`;
    const capturedAt = job.updatedAt.includes("T") ? job.updatedAt : `${job.updatedAt}T00:00:00.000Z`;
    references[id] = {
      id,
      revisionOf: null,
      sourceCategory: "internal",
      providerName: "ข้อมูลเดิมในระบบ",
      sourceUrl: "",
      externalReference: job.workflow.caseId || job.id,
      originalJobId: job.id,
      propertyType: job.property.propertyType,
      address: job.property.address,
      latitude: job.property.latitude,
      longitude: job.property.longitude,
      totalPrice: job.valuation.comparePrice,
      unitPrice: 0,
      unit: "none",
      landArea: job.property.landArea,
      usableArea: job.property.usableArea,
      observedAt: job.updatedAt.slice(0, 10),
      capturedAt,
      capturedBy: "admin",
    };
    job.selectedReferences = [{
      referenceId: id,
      selectedAt: capturedAt,
      selectedBy: "admin",
      adjustmentNote: "ข้อมูลเดิมไม่ทราบแหล่งที่มา",
    }];
  }
}

function addSummaryValue(
  groups: Map<string, { source: PriceReferenceSource; unit: ReferenceSummaryUnit; values: number[] }>,
  source: PriceReferenceSource,
  unit: ReferenceSummaryUnit,
  value: number,
) {
  const key = `${source}|${unit}`;
  const group = groups.get(key) ?? { source, unit, values: [] };
  group.values.push(value);
  groups.set(key, group);
}

function coordinates(latitude: string, longitude: string): { latitude: number; longitude: number } | null {
  if (latitude.trim() === "" || longitude.trim() === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRad(lat2 - lat1);
  const lngDelta = toRad(lng2 - lng1);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function subtractMonths(date: string, months: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCMonth(parsed.getUTCMonth() - Math.floor(months));
  return parsed.toISOString().slice(0, 10);
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTeam(value: unknown): value is Team {
  return value === "teamA" || value === "teamB" || value === "teamC" || value === "admin";
}
