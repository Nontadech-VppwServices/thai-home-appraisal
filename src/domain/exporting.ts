import { calculateValuation, type AppraisalJob } from "./appraisal";

export const appraisalCsvColumns = [
  "job_id",
  "bank_reference",
  "bank",
  "client_name",
  "received_at",
  "due_date",
  "visit_date",
  "assignee",
  "status",
  "address",
  "latitude",
  "longitude",
  "property_type",
  "condition",
  "land_area_sq_wah",
  "usable_area_sq_m",
  "floors",
  "build_year",
  "bedrooms",
  "bathrooms",
  "valuation_method",
  "valuation_price_thb",
  "selected_reference_count",
  "photo_count",
] as const;

export type AppraisalCsvRow = Record<(typeof appraisalCsvColumns)[number], string | number>;

export function appraisalToCsvRow(job: AppraisalJob): AppraisalCsvRow {
  return {
    job_id: job.id,
    bank_reference: job.workflow.caseId,
    bank: job.workflow.bank,
    client_name: job.workflow.clientName,
    received_at: job.receivedAt,
    due_date: job.dueDate,
    visit_date: job.workflow.visitDate,
    assignee: job.assignee,
    status: job.status,
    address: job.property.address,
    latitude: job.property.latitude,
    longitude: job.property.longitude,
    property_type: job.property.propertyType,
    condition: job.property.condition,
    land_area_sq_wah: job.property.landArea,
    usable_area_sq_m: job.property.usableArea,
    floors: job.property.floors,
    build_year: job.property.buildYear,
    bedrooms: job.property.bedrooms,
    bathrooms: job.property.bathrooms,
    valuation_method: job.valuation.method,
    valuation_price_thb: calculateValuation(job.property, job.valuation).price,
    selected_reference_count: job.selectedReferences.length,
    photo_count: job.photos.length,
  };
}

export function serializeAppraisalCsv(job: AppraisalJob): string {
  const row = appraisalToCsvRow(job);
  const header = appraisalCsvColumns.map(csvCell).join(",");
  const values = appraisalCsvColumns.map((column) => csvCell(row[column])).join(",");
  return `\uFEFF${header}\r\n${values}\r\n`;
}

export function appraisalCsvFilename(job: AppraisalJob): string {
  const raw = job.workflow.caseId.trim() || job.id;
  const safe = raw.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "") || "appraisal";
  return `${safe}-appraisal.csv`;
}

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
