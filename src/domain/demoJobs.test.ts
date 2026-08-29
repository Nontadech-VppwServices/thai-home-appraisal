import { describe, expect, it } from "vitest";
import { canTransition, ownerTeamOf } from "./appraisal";
import { createDemoJobs, demoIdPrefix, demoJobCount, isDemoJob } from "./demoJobs";

const TODAY = "2026-08-29";

describe("createDemoJobs", () => {
  it("ให้ผลเหมือนเดิมทุกครั้งเมื่อ seed และวันที่เท่ากัน", () => {
    expect(createDemoJobs({ today: TODAY })).toEqual(createDemoJobs({ today: TODAY }));
    expect(createDemoJobs({ today: TODAY, seed: 1 })).not.toEqual(createDemoJobs({ today: TODAY, seed: 2 }));
  });

  it("สร้างงานตามจำนวนที่กำหนด และแยกออกจากงานจริงได้ด้วยรหัสงาน", () => {
    const jobs = createDemoJobs({ today: TODAY });

    expect(jobs).toHaveLength(demoJobCount);
    expect(jobs.every((job) => job.id.startsWith(demoIdPrefix) && isDemoJob(job))).toBe(true);
    expect(createDemoJobs({ today: TODAY, count: 5 })).toHaveLength(5);
  });

  it("ประวัติสถานะเดินตามลำดับที่อนุญาตและจบตรงกับสถานะปัจจุบัน", () => {
    for (const job of createDemoJobs({ today: TODAY })) {
      const history = job.statusHistory;

      expect(history[0].from).toBeNull();
      expect(history[0].to).toBe("intake");
      for (let index = 1; index < history.length; index += 1) {
        expect(canTransition(history[index - 1].to, history[index].to)).toBe(true);
        expect(history[index].from).toBe(history[index - 1].to);
        expect(history[index].at >= history[index - 1].at).toBe(true);
      }
      expect(job.status).toBe(history[history.length - 1].to);
      expect(job.updatedAt).toBe(history[history.length - 1].at);
    }
  });

  it("ผู้ทำแต่ละขั้นคือทีมที่ถือสถานะก่อนหน้า", () => {
    for (const job of createDemoJobs({ today: TODAY, count: 8 })) {
      job.statusHistory.slice(1).forEach((change, index) => {
        expect(change.actor).toBe(ownerTeamOf(job.statusHistory[index].to) ?? "admin");
      });
    }
  });

  it("ไม่แนบรูปถ่าย เพื่อไม่ให้พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม", () => {
    expect(createDemoJobs({ today: TODAY }).every((job) => job.photos.length === 0)).toBe(true);
  });

  it("มีทั้งงานปิด งานค้าง และงานที่ถูกตีกลับ ให้รายงานมีข้อมูลครบทุกส่วน", () => {
    const jobs = createDemoJobs({ today: TODAY });

    expect(jobs.some((job) => job.status === "submitted")).toBe(true);
    expect(jobs.some((job) => job.status !== "submitted")).toBe(true);
    expect(jobs.some((job) => job.statusHistory.some((change) => change.to === "changesRequested"))).toBe(true);
    expect(jobs.every((job) => job.dueDate !== "" && job.receivedAt <= TODAY)).toBe(true);
  });
});
