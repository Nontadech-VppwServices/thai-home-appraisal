import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyJob } from "../../domain/appraisal";
import { createDrawing } from "../../domain/drawings";
import { migrateLegacyComparablePrices, type PriceReferenceSnapshot } from "../../domain/priceReferences";
import { getJob, removeDrawing, saveDrawing, saveJob } from "./appraisalStore";

afterEach(() => vi.unstubAllGlobals());

describe("drawing persistence", () => {
  it("คัดลอกและลบฉบับที่เลือกโดยคงฉบับอื่น และไม่อ้างว่าบันทึกสำเร็จเมื่อพื้นที่เต็ม", () => {
    const values = new Map<string, string>();
    let full = false;
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { if (full) throw new Error("QuotaExceededError"); values.set(key, value); },
      },
      dispatchEvent: () => true,
    });
    const job = createEmptyJob("drawings-storage-test", "2026-09-22");
    job.status = "assigned";
    saveJob(job);
    const first = createDrawing("room", "room-original", "2026-09-22T00:00:00.000Z");
    saveDrawing(job.id, first);
    saveDrawing(job.id, { ...first, id: "room-copy", title: "สำเนา" });
    expect(getJob(job.id)?.drawings.map((item) => item.id)).toEqual(["room-original", "room-copy"]);
    removeDrawing(job.id, "room-copy");
    expect(getJob(job.id)?.drawings.map((item) => item.id)).toEqual(["room-original"]);

    full = true;
    expect(() => saveDrawing(job.id, { ...first, title: "บันทึกไม่สำเร็จ" })).toThrow("QuotaExceededError");
    expect(getJob(job.id)?.drawings[0].title).toBe(first.title);

    full = false;
    saveJob({ ...getJob(job.id)!, status: "submitted" });
    expect(() => saveDrawing(job.id, first)).toThrow("สถานะงานนี้แก้แบบแปลงไม่ได้");
  });

  it("ลบแบบประเภทเดิมจาก localStorage และบันทึก schema ใหม่เพียงครั้งเดียว", () => {
    const values = new Map<string, string>();
    const writes: string[] = [];
    const job = createEmptyJob("drawing-migration-test", "2026-09-23");
    job.drawings = [createDrawing("room", "keep-room", "2026-09-23T00:00:00.000Z")];
    const rawJob = { ...job, drawings: [...job.drawings, { id: "remove-land", type: "land", title: "แปลงที่ดิน", elements: [], includeInReport: false, updatedAt: "now" }] };
    values.set("thaiHomeAppraisals:v1", JSON.stringify({ schemaVersion: 1, jobs: { [job.id]: rawJob }, references: {}, currentJobId: job.id, activities: [] }));
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes.push(value); values.set(key, value); } }, dispatchEvent: () => true });
    expect(getJob(job.id)?.drawings.map((item) => item.id)).toEqual(["keep-room"]);
    expect(JSON.parse(writes.at(-1)!).schemaVersion).toBe(2);
    expect(JSON.parse(writes.at(-1)!).jobs[job.id].drawings).toHaveLength(1);
  });
});

describe("migrateLegacyComparablePrices", () => {
  it("ย้าย comparePrice เดิมเป็น snapshot และ selection แบบ deterministic", () => {
    const job = createEmptyJob("job-legacy", "2026-08-28");
    job.workflow.caseId = "APP-OLD-1";
    job.valuation.method = "compare";
    job.valuation.comparePrice = 4_100_000;
    const jobs = { [job.id]: job };
    const references: Record<string, PriceReferenceSnapshot> = {};

    migrateLegacyComparablePrices(jobs, references);
    migrateLegacyComparablePrices(jobs, references);

    expect(Object.keys(references)).toEqual(["legacy-compare-job-legacy"]);
    expect(job.selectedReferences).toEqual([{
      referenceId: "legacy-compare-job-legacy",
      selectedAt: "2026-08-28T00:00:00.000Z",
      selectedBy: "admin",
      adjustmentNote: "ข้อมูลเดิมไม่ทราบแหล่งที่มา",
    }]);
    expect(references["legacy-compare-job-legacy"]).toMatchObject({
      totalPrice: 4_100_000,
      providerName: "ข้อมูลเดิมในระบบ",
      externalReference: "APP-OLD-1",
    });
  });
});
