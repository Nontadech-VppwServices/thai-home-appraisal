import { describe, expect, it } from "vitest";
import {
  calculateValuation,
  createEmptyJob,
  hasDuplicateActiveBankReference,
  intakeMissingFields,
  normalizeChecklistState,
  normalizeStoredJob,
  submissionReadiness,
  transitionJob,
} from "./appraisal";

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

describe("normalizeChecklistState", () => {
  it("แทรกช่องข้อมูลอ้างอิงโดยไม่เลื่อนความหมายของ checklist รุ่นเดิม", () => {
    expect(normalizeChecklistState([true, false, true, true, false])).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
  });
});

describe("interactive workflow", () => {
  it("ตรวจความพร้อมก่อนมอบหมายและก่อนส่งทีม C", () => {
    const job = createEmptyJob("job-1", "2026-08-28");
    expect(intakeMissingFields(job)).toContain("ผู้ประเมินทีม B");
    expect(submissionReadiness(job).ready).toBe(false);

    job.workflow.bank = "ธนาคารกรุงเทพ";
    job.workflow.caseId = "BK-001";
    job.workflow.clientName = "ลูกค้า";
    job.receivedAt = "2026-08-28";
    job.dueDate = "2026-09-05";
    job.property.address = "กรุงเทพฯ";
    job.property.usableArea = 120;
    job.assignee = "ผู้ประเมิน 01";
    job.photos = [{ id: "p1", name: "front.jpg", dataUrl: "data:image/jpeg;base64,x" }];
    job.valuation.manualPrice = 3_000_000;

    expect(intakeMissingFields(job)).toEqual([]);
    expect(submissionReadiness(job).ready).toBe(true);
  });

  it("บังคับลำดับสถานะและเหตุผลตอนตีกลับ", () => {
    const job = createEmptyJob("job-1", "2026-08-28");
    const assigned = transitionJob(job, "assigned", "teamA", "มอบหมาย", "2026-08-28T01:00:00.000Z");
    const ready = transitionJob(assigned, "readyToSubmit", "teamB", "ส่งตรวจ", "2026-08-29T01:00:00.000Z");

    expect(() => transitionJob(ready, "changesRequested", "teamC", "")).toThrow("กรุณาระบุเหตุผล");
    expect(() => transitionJob(job, "submitted", "teamC", "ข้ามขั้น")).toThrow("เปลี่ยนสถานะ");
    expect(transitionJob(ready, "submitted", "teamC", "ส่งแล้ว").statusHistory).toHaveLength(4);
  });

  it("เติม schema ใหม่ให้ข้อมูล localStorage รุ่นเดิม", () => {
    const normalized = normalizeStoredJob({
      id: "old-job",
      status: "saved",
      workflow: { caseId: "OLD-1" },
      createdAt: "2026-08-28",
    }, "2026-08-29");

    expect(normalized?.workflow.siteContactName).toBe("");
    expect(normalized?.submission).toBeNull();
    expect(normalized?.status).toBe("intake");
  });

  it("ตรวจเลขอ้างอิงซ้ำเฉพาะงานที่ยังไม่ปิดของธนาคารเดียวกัน", () => {
    const existing = createEmptyJob("existing", "2026-08-28");
    existing.workflow.bank = "ธนาคารกรุงเทพ";
    existing.workflow.caseId = "BK-001";

    expect(hasDuplicateActiveBankReference([existing], "new", "ธนาคารกรุงเทพ", "bk-001")).toBe(true);
    existing.status = "submitted";
    expect(hasDuplicateActiveBankReference([existing], "new", "ธนาคารกรุงเทพ", "BK-001")).toBe(false);
  });
});
