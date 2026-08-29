import { describe, expect, it } from "vitest";
import { appendDemoActivity, normalizeDemoActivities, type DemoActivity } from "./activity";

const activity = (id: string): DemoActivity => ({
  id,
  type: "csvExported",
  jobId: "job-1",
  actor: "teamC",
  at: "2026-08-29T00:00:00.000Z",
  result: "success",
  reference: `${id}.csv`,
});

describe("demo activity", () => {
  it("เรียงใหม่ก่อนและจำกัดจำนวนรายการ", () => {
    expect(appendDemoActivity([activity("a"), activity("b")], activity("c"), 2).map((item) => item.id))
      .toEqual(["c", "a"]);
  });

  it("ทิ้ง record ที่ schema ไม่ถูกต้อง", () => {
    expect(normalizeDemoActivities([activity("a"), { id: "bad" }])).toEqual([activity("a")]);
  });
});
