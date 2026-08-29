import type { DateRange } from "@/domain/reporting";

/** ตัวช่วยจัดรูปแบบที่ใช้ร่วมกันทุกส่วนของหน้ารายงาน */

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const countFormatter = new Intl.NumberFormat("th-TH");

export function formatDate(dateISO: string): string {
  if (dateISO === "") return "—";
  return dateFormatter.format(new Date(`${dateISO.slice(0, 10)}T00:00:00.000Z`));
}

export function formatRange(range: DateRange): string {
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatDays(value: number): string {
  return `${countFormatter.format(value)} วัน`;
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

/**
 * ประมาณการวันเคลียร์งานค้าง
 * null = ยังไม่มีงานปิดในช่วงนี้ จึงคำนวณความเร็วไม่ได้ ต้องไม่แสดงเป็น 0 วัน
 * ค่าที่สูงมากไม่มีความหมายในทางปฏิบัติ จึงตัดที่ 1 ปี
 */
export function formatBacklogDays(value: number | null): string {
  if (value === null) return "—";
  if (value > 365) return "เกิน 1 ปี";
  return formatDays(value);
}
