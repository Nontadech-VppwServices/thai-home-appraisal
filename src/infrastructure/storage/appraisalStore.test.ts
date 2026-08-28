import { describe, expect, it } from "vitest";
import { createEmptyJob } from "../../domain/appraisal";
import { migrateLegacyComparablePrices, type PriceReferenceSnapshot } from "../../domain/priceReferences";

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
