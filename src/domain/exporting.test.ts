import { describe, expect, it } from "vitest";
import { createEmptyJob } from "./appraisal";
import { appraisalCsvFilename, serializeAppraisalCsv } from "./exporting";

describe("CSV export", () => {
  it("สร้าง CSV UTF-8 พร้อม escape และไม่ส่งออกรูป", () => {
    const job = createEmptyJob("job-1", "2026-08-29");
    job.workflow.caseId = "BK,\"001\"";
    job.property.address = "บรรทัดหนึ่ง\nบรรทัดสอง";
    job.photos = [{ id: "p1", name: "front.jpg", dataUrl: "data:image/jpeg;base64,secret" }];

    const csv = serializeAppraisalCsv(job);
    expect(csv.startsWith("\uFEFFjob_id")).toBe(true);
    expect(csv).toContain('"BK,""001"""');
    expect(csv).toContain('"บรรทัดหนึ่ง\nบรรทัดสอง"');
    expect(csv).not.toContain("base64");
  });

  it("ทำชื่อไฟล์ให้ปลอดภัย", () => {
    const job = createEmptyJob("job-1", "2026-08-29");
    job.workflow.caseId = "BK/001 test";
    expect(appraisalCsvFilename(job)).toBe("BK-001-test-appraisal.csv");
  });
});
