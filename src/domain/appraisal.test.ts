import { describe, expect, it } from "vitest";
import { calculateValuation, createEmptyJob } from "./appraisal";

describe("calculateValuation", () => {
  it("returns the manual price and basis", () => {
    const job = createEmptyJob("job-1", "2026-08-28");
    job.valuation.manualPrice = 3_450_000;

    expect(calculateValuation(job.property, job.valuation)).toEqual({
      method: "manual",
      price: 3_450_000,
      basis: "ผู้ประเมินกรอกมูลค่าเอง",
    });
  });

  it("calculates usable area multiplied by rate", () => {
    const job = createEmptyJob("job-1", "2026-08-28");
    job.property.usableArea = 128;
    job.valuation.method = "area";
    job.valuation.rate = 26_500;

    expect(calculateValuation(job.property, job.valuation)).toEqual({
      method: "area",
      price: 3_392_000,
      basis: "128 ตร.ม. x 26,500 บาท",
    });
  });

  it("returns the comparable property price", () => {
    const job = createEmptyJob("job-1", "2026-08-28");
    job.valuation.method = "compare";
    job.valuation.comparePrice = 4_100_000;

    expect(calculateValuation(job.property, job.valuation)).toEqual({
      method: "compare",
      price: 4_100_000,
      basis: "อ้างอิงจากทรัพย์เปรียบเทียบ",
    });
  });
});
