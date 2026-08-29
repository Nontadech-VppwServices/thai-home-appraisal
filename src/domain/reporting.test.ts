import { describe, expect, it } from "vitest";
import { createEmptyJob, ownerTeamOf, type AppraisalJob, type JobStatus, type StatusChange } from "./appraisal";
import {
  addDays,
  assigneeStats,
  bucketSizeFor,
  buildReport,
  bankBreakdown,
  cycleTimeReport,
  onTimeRate,
  resolveRange,
  reworkRate,
  stageEntries,
  stageStats,
  submittedAtOf,
  summariseJob,
  teamStats,
  trendSeries,
  unassignedLabel,
  wipReport,
  type DateRange,
} from "./reporting";

const TODAY = "2026-08-29";

/** ทุก test ใช้ asOf ตายตัว ผลลัพธ์จึงไม่ขึ้นกับวันที่รันจริง */
function job(options: {
  id?: string;
  received: string;
  due?: string;
  assignee?: string;
  bank?: string;
  price?: number;
  /** ลำดับสถานะที่งานผ่าน คู่กับเวลาที่เข้าสถานะนั้น เรียงเก่า -> ใหม่ */
  path: [JobStatus, string][];
}): AppraisalJob {
  const base = createEmptyJob(options.id ?? "job-1", options.received);
  const history: StatusChange[] = options.path.map(([to, at], index) => ({
    from: index === 0 ? null : options.path[index - 1][0],
    to,
    actor: index === 0 ? "teamA" : (ownerTeamOf(options.path[index - 1][0]) ?? "admin"),
    at,
    note: "",
  }));
  const last = history[history.length - 1];

  return {
    ...base,
    status: last.to,
    workflow: { ...base.workflow, bank: options.bank ?? "" },
    valuation: { ...base.valuation, manualPrice: options.price ?? 0 },
    updatedAt: last.at,
    receivedAt: options.received,
    dueDate: options.due ?? "",
    assignee: options.assignee ?? "",
    statusHistory: history,
  };
}

/** ปิดงานตรงไปตรงมา: intake 1 วัน, assigned 3 วัน, readyToSubmit 1 วัน, รวม 5 วัน */
function closedJob(overrides: Partial<Parameters<typeof job>[0]> = {}): AppraisalJob {
  return job({
    id: "closed-1",
    received: "2026-08-01",
    assignee: "สมชาย",
    path: [
      ["intake", "2026-08-01T00:00:00.000Z"],
      ["assigned", "2026-08-02T00:00:00.000Z"],
      ["readyToSubmit", "2026-08-05T00:00:00.000Z"],
      ["submitted", "2026-08-06T00:00:00.000Z"],
    ],
    ...overrides,
  });
}

/** งานที่ถูกตีกลับหนึ่งรอบ: teamB ทำสองช่วง (assigned 2 วัน, changesRequested 2 วัน) รวม 7 วัน */
function reworkJob(overrides: Partial<Parameters<typeof job>[0]> = {}): AppraisalJob {
  return job({
    id: "rework-1",
    received: "2026-08-01",
    assignee: "สมชาย",
    path: [
      ["intake", "2026-08-01T00:00:00.000Z"],
      ["assigned", "2026-08-02T00:00:00.000Z"],
      ["readyToSubmit", "2026-08-04T00:00:00.000Z"],
      ["changesRequested", "2026-08-05T00:00:00.000Z"],
      ["readyToSubmit", "2026-08-07T00:00:00.000Z"],
      ["submitted", "2026-08-08T00:00:00.000Z"],
    ],
    ...overrides,
  });
}

/** งานที่ยังค้างอยู่ที่ทีม B */
function openJob(overrides: Partial<Parameters<typeof job>[0]> = {}): AppraisalJob {
  return job({
    id: "open-1",
    received: "2026-08-25",
    assignee: "สมชาย",
    path: [
      ["intake", "2026-08-25T00:00:00.000Z"],
      ["assigned", "2026-08-26T00:00:00.000Z"],
    ],
    ...overrides,
  });
}

const august: DateRange = { from: "2026-08-01", to: "2026-08-31" };

describe("resolveRange", () => {
  it("ทุก preset เป็นช่วงย้อนหลังนับถึงวันนี้ ไม่ใช่ปฏิทิน", () => {
    expect(resolveRange("day", TODAY)).toEqual({ from: "2026-08-29", to: "2026-08-29" });
    expect(resolveRange("week", TODAY)).toEqual({ from: "2026-08-23", to: "2026-08-29" });
    expect(resolveRange("month", TODAY)).toEqual({ from: "2026-07-31", to: "2026-08-29" });
    expect(resolveRange("year", TODAY)).toEqual({ from: "2025-08-30", to: "2026-08-29" });
  });

  it("สลับให้เมื่อช่วงกำหนดเองกลับด้าน", () => {
    expect(resolveRange("custom", TODAY, { from: "2026-08-20", to: "2026-08-10" })).toEqual({
      from: "2026-08-10",
      to: "2026-08-20",
    });
  });

  it("ถอยไปใช้ 30 วันเมื่อช่วงกำหนดเองไม่ครบหรือผิดรูปแบบ", () => {
    const fallback = resolveRange("month", TODAY);
    expect(resolveRange("custom", TODAY, { from: "2026-08-20" })).toEqual(fallback);
    expect(resolveRange("custom", TODAY, { from: "ไม่ใช่วันที่", to: "2026-08-20" })).toEqual(fallback);
    expect(resolveRange("custom", TODAY)).toEqual(fallback);
  });
});

describe("bucketSizeFor", () => {
  it("เลือกขนาดกลุ่มจากความยาวช่วงที่ขอบเขต 31 และ 120 วัน", () => {
    expect(bucketSizeFor({ from: "2026-08-01", to: "2026-08-31" })).toBe("day");
    expect(bucketSizeFor({ from: "2026-08-01", to: "2026-09-01" })).toBe("week");
    expect(bucketSizeFor({ from: "2026-01-01", to: "2026-04-30" })).toBe("week");
    expect(bucketSizeFor({ from: "2026-01-01", to: "2026-05-01" })).toBe("month");
    expect(bucketSizeFor(resolveRange("year", TODAY))).toBe("month");
  });
});

describe("addDays", () => {
  it("ข้ามปีได้และไม่เลื่อนวันจากเขตเวลา UTC+7", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-08-29", 0)).toBe("2026-08-29");
  });

  it("นับงานที่ตรงขอบช่วงพอดีทั้งสองข้าง", () => {
    const jobs = [
      closedJob({ id: "edge-from", received: "2026-08-01" }),
      closedJob({ id: "edge-to", received: "2026-08-31" }),
    ];

    expect(buildReport(jobs, { preset: "custom", range: august }, TODAY).received).toBe(2);
  });
});

describe("submittedAtOf และ stageEntries", () => {
  it("คืน null เมื่องานยังไม่ปิด", () => {
    expect(submittedAtOf(openJob())).toBeNull();
    expect(submittedAtOf(closedJob())).toBe("2026-08-06T00:00:00.000Z");
  });

  it("แตกช่วงเวลาต่อขั้นตอน โดยไม่นับ submitted เป็นขั้นตอนที่ใช้เวลา", () => {
    expect(stageEntries(closedJob(), TODAY)).toEqual([
      { status: "intake", team: "teamA", start: "2026-08-01T00:00:00.000Z", end: "2026-08-02T00:00:00.000Z", days: 1, open: false },
      { status: "assigned", team: "teamB", start: "2026-08-02T00:00:00.000Z", end: "2026-08-05T00:00:00.000Z", days: 3, open: false },
      { status: "readyToSubmit", team: "teamC", start: "2026-08-05T00:00:00.000Z", end: "2026-08-06T00:00:00.000Z", days: 1, open: false },
    ]);
  });

  it("นับขั้นตอนที่เข้าซ้ำเป็นคนละช่วง เมื่องานถูกตีกลับ", () => {
    const entries = stageEntries(reworkJob(), TODAY);

    expect(entries).toHaveLength(5);
    expect(entries.filter((entry) => entry.status === "readyToSubmit")).toHaveLength(2);
    expect(entries.some((entry) => entry.status === "submitted")).toBe(false);
    expect(entries.filter((entry) => entry.team === "teamB").map((entry) => entry.days)).toEqual([2, 2]);
  });

  it("ช่วงที่ยังไม่จบวัดถึงสิ้นวันของ asOf และขยับตาม asOf", () => {
    const [, current] = stageEntries(openJob(), TODAY);

    expect(current.open).toBe(true);
    expect(current.days).toBeCloseTo(4, 3);
    expect(stageEntries(openJob(), "2026-08-30")[1].days).toBeCloseTo(5, 3);
  });
});

describe("summariseJob", () => {
  it("ไม่ถือว่าเลยกำหนดเมื่อยังไม่ได้กำหนดวันส่ง", () => {
    expect(summariseJob(closedJob({ due: "" }), TODAY).overdueDays).toBe(0);
  });

  it("วัดงานที่ปิดแล้วกับวันที่ส่งจริง ไม่ใช่วันนี้", () => {
    expect(summariseJob(closedJob({ due: "2026-08-04" }), TODAY).overdueDays).toBe(2);
    expect(summariseJob(closedJob({ due: "2026-08-10" }), TODAY).overdueDays).toBe(0);
  });

  it("นับงานที่ยังไม่ปิดถึงวันนี้", () => {
    expect(summariseJob(openJob({ due: "2026-08-27" }), TODAY).overdueDays).toBe(2);
  });

  it("ถือว่ามีความเคลื่อนไหวเมื่อทีมยังแก้ข้อมูล แม้สถานะไม่เปลี่ยน", () => {
    const stale = openJob();
    const edited = { ...stale, updatedAt: "2026-08-28T00:00:00.000Z" };

    expect(summariseJob(stale, TODAY).idleDays).toBeCloseTo(4, 3);
    expect(summariseJob(edited, TODAY).idleDays).toBeCloseTo(2, 3);
    expect(summariseJob(edited, TODAY).ageInStatusDays).toBeCloseTo(4, 3);
  });
});

describe("wipReport", () => {
  it("ไม่นับงานที่ปิดแล้ว และคืนทุกขั้นตอนเสมอแม้ไม่มีงาน", () => {
    const report = wipReport([closedJob()], TODAY);

    expect(report.openTotal).toBe(0);
    expect(report.stages.map((stage) => stage.status)).toEqual([
      "intake",
      "assigned",
      "changesRequested",
      "readyToSubmit",
    ]);
    expect(report.stages.every((stage) => stage.averageAgeDays === 0 && stage.oldestDays === 0)).toBe(true);
  });

  it("จัดกลุ่มงานค้างตามขั้นตอนพร้อมทีมเจ้าของ", () => {
    const report = wipReport([openJob(), openJob({ id: "open-2" }), closedJob()], TODAY);
    const assigned = report.stages.find((stage) => stage.status === "assigned");

    expect(report.openTotal).toBe(2);
    expect(assigned).toMatchObject({ count: 2, team: "teamB", teamLabel: "ทีม B", averageAgeDays: 4 });
  });

  it("ถือว่าค้างนานเมื่อไม่มีความเคลื่อนไหวเกิน staleAfterDays แบบเข้ม และคืนรายการแบบไม่จำกัดจำนวน", () => {
    const idle = openJob({ id: "idle", received: "2026-08-10", path: [["intake", "2026-08-10T00:00:00.000Z"]] });
    const report = wipReport([idle, openJob()], TODAY);

    expect(report.stale.map((row) => row.id)).toEqual(["idle"]);
    expect(report.oldest.map((row) => row.id)).toEqual(["idle", "open-1"]);
  });
});

describe("stageStats", () => {
  it("นับช่วงที่ยังไม่จบเมื่อวันนี้อยู่ในช่วงที่เลือก", () => {
    const range = resolveRange("month", TODAY);
    const assigned = stageStats([openJob()], range, TODAY).find((stage) => stage.status === "assigned");

    expect(assigned).toMatchObject({ entries: 1, openEntries: 1 });
  });

  it("ตัดช่วงที่ยังไม่จบทิ้งเมื่อช่วงที่เลือกอยู่ในอดีตล้วน", () => {
    const past: DateRange = { from: "2026-07-01", to: "2026-07-31" };
    const assigned = stageStats([openJob()], past, TODAY).find((stage) => stage.status === "assigned");

    expect(assigned).toMatchObject({ entries: 0, openEntries: 0, averageDays: 0, medianDays: 0, overTarget: false });
  });

  it("ชี้ว่าเกินเป้าเมื่อค่ากลางสูงกว่าเป้าของขั้นตอนนั้น", () => {
    const stats = stageStats([closedJob()], august, TODAY);
    const assigned = stats.find((stage) => stage.status === "assigned");
    const intake = stats.find((stage) => stage.status === "intake");

    expect(assigned).toMatchObject({ medianDays: 3, targetDays: 3, overTarget: false });
    expect(intake).toMatchObject({ medianDays: 1, targetDays: 1, overTarget: false });
    expect(stageStats([closedJob({ path: [
      ["intake", "2026-08-01T00:00:00.000Z"],
      ["assigned", "2026-08-02T00:00:00.000Z"],
      ["readyToSubmit", "2026-08-12T00:00:00.000Z"],
      ["submitted", "2026-08-13T00:00:00.000Z"],
    ] })], august, TODAY).find((stage) => stage.status === "assigned")).toMatchObject({
      medianDays: 10,
      overTarget: true,
    });
  });
});

describe("cycleTimeReport", () => {
  it("คืนศูนย์ทุกช่องบนข้อมูลว่าง และยังคงถังทั้งห้า", () => {
    const report = cycleTimeReport([], august);

    expect(report).toEqual({
      completed: 0,
      averageDays: 0,
      medianDays: 0,
      p90Days: 0,
      fastestDays: 0,
      slowestDays: 0,
      distribution: [
        { label: "0-3 วัน", count: 0 },
        { label: "4-7 วัน", count: 0 },
        { label: "8-14 วัน", count: 0 },
        { label: "15-30 วัน", count: 0 },
        { label: "เกิน 30 วัน", count: 0 },
      ],
    });
  });

  it("วัดจากวันรับงานถึงเวลาที่ส่งธนาคาร", () => {
    const report = cycleTimeReport([closedJob(), reworkJob()], august);

    expect(report).toMatchObject({ completed: 2, fastestDays: 5, slowestDays: 7, averageDays: 6, medianDays: 6 });
  });

  it("ค่าที่ตรงขอบถังพอดีตกถังล่าง", () => {
    const cycles = [3, 7, 14, 30].map((days, index) =>
      closedJob({
        id: `cycle-${index}`,
        received: "2026-08-01",
        path: [
          ["intake", "2026-08-01T00:00:00.000Z"],
          ["assigned", "2026-08-02T00:00:00.000Z"],
          ["submitted", addDays("2026-08-01", days) + "T00:00:00.000Z"],
        ],
      }),
    );

    expect(cycleTimeReport(cycles, { from: "2026-08-01", to: "2026-09-30" }).distribution.map((row) => row.count)).toEqual([
      1, 1, 1, 1, 0,
    ]);
  });
});

describe("teamStats", () => {
  it("นับการส่งงานต่อของทีมที่ถือขั้นตอนนั้น และนับงานที่ตีกลับสองครั้ง", () => {
    const stats = teamStats([reworkJob()], august, TODAY);

    expect(stats.find((team) => team.team === "teamB")).toMatchObject({ handoffs: 2, averageHandlingDays: 2 });
    expect(stats.find((team) => team.team === "teamA")).toMatchObject({ handoffs: 1 });
    expect(stats.find((team) => team.team === "teamC")).toMatchObject({ handoffs: 2 });
  });

  it("คืน null เมื่อยังไม่มีงานปิดในช่วง จึงประมาณวันเคลียร์งานค้างไม่ได้", () => {
    const stats = teamStats([openJob()], { from: "2026-08-20", to: "2026-08-29" }, TODAY);

    expect(stats.find((team) => team.team === "teamB")).toMatchObject({ openJobs: 1, clearBacklogDays: null });
  });

  it("ประมาณวันเคลียร์งานค้างจากความเร็วเดิม", () => {
    const range: DateRange = { from: "2026-08-01", to: "2026-08-10" };
    const stats = teamStats([closedJob(), openJob(), openJob({ id: "open-2" })], range, TODAY);

    expect(stats.find((team) => team.team === "teamB")).toMatchObject({ handoffs: 1, openJobs: 2, clearBacklogDays: 20 });
  });
});

describe("trendSeries", () => {
  it("จำนวนจุดเท่ากับจำนวนวันเมื่อจัดกลุ่มรายวัน และผลรวมตรงกับตัวเลขสรุป", () => {
    const jobs = [closedJob(), reworkJob(), openJob()];
    const points = trendSeries(jobs, august);
    const report = buildReport(jobs, { preset: "custom", range: august }, TODAY);

    expect(points).toHaveLength(31);
    expect(points.reduce((sum, point) => sum + point.received, 0)).toBe(report.received);
    expect(points.reduce((sum, point) => sum + point.submitted, 0)).toBe(report.submitted);
  });

  it("จัดกลุ่มรายเดือน 13 จุดสำหรับช่วง 12 เดือน โดยจุดแรกถูกตัดให้เริ่มที่ต้นช่วง", () => {
    const range = resolveRange("year", TODAY);
    const points = trendSeries([closedJob()], range);

    expect(points).toHaveLength(13);
    expect(points[0].key).toBe(range.from);
    expect(points.reduce((sum, point) => sum + point.submitted, 0)).toBe(1);
  });

  it("ไม่ทิ้งงานที่ตรงกับวันเริ่มกลุ่มพอดี", () => {
    const points = trendSeries([closedJob({ received: "2026-08-01" })], august);

    expect(points[0].received).toBe(1);
  });
});

describe("onTimeRate และ reworkRate", () => {
  it("ไม่นับงานที่ไม่ได้กำหนดวันส่งเป็นฐาน และส่งตรงวันพอดีถือว่าตรงเวลา", () => {
    const jobs = [
      closedJob({ id: "no-due" }),
      closedJob({ id: "exact", due: "2026-08-06" }),
      closedJob({ id: "late", due: "2026-08-05" }),
    ];

    expect(onTimeRate(jobs, august)).toEqual({ hit: 1, total: 2, rate: 0.5 });
    expect(onTimeRate([], august)).toEqual({ hit: 0, total: 0, rate: 0 });
  });

  it("ใช้ฐานเป็นงานเข้าในช่วง ไม่ใช่งานปิดในช่วง", () => {
    const before = reworkJob({ id: "before", received: "2026-07-20" });

    expect(reworkRate([closedJob(), reworkJob()], august)).toEqual({ hit: 1, total: 2, rate: 0.5 });
    expect(reworkRate([before], august)).toEqual({ hit: 0, total: 0, rate: 0 });
  });
});

describe("bankBreakdown", () => {
  it("รวมงานที่ยังไม่ระบุธนาคารเป็นกลุ่มเดียว และคิดมูลค่าเฉพาะงานที่ปิดในช่วง", () => {
    const rows = bankBreakdown(
      [
        closedJob({ id: "a", bank: "ธนาคารกสิกรไทย", price: 3_000_000 }),
        closedJob({ id: "b", bank: "ธนาคารกสิกรไทย", price: 2_000_000 }),
        openJob({ id: "c", bank: "", price: 9_000_000 }),
      ],
      august,
    );

    expect(rows).toEqual([
      { bank: "ธนาคารกสิกรไทย", received: 2, submitted: 2, totalValue: 5_000_000 },
      { bank: "ยังไม่ระบุ", received: 1, submitted: 0, totalValue: 0 },
    ]);
  });
});

describe("buildReport", () => {
  it("ชี้คอขวดจากขั้นตอนที่ค่ากลางสูงสุด และคืน null เมื่อไม่มีข้อมูล", () => {
    const report = buildReport([reworkJob()], { preset: "custom", range: august }, TODAY);

    expect(report.bottleneck?.status).toBe("assigned");
    expect(buildReport([], { preset: "custom", range: august }, TODAY).bottleneck).toBeNull();
  });

  it("มูลค่ารวมเท่ากับผลรวมของแยกรายธนาคาร", () => {
    const jobs = [closedJob({ id: "a", bank: "ก", price: 3_000_000 }), reworkJob({ id: "b", bank: "ข", price: 1_500_000 })];
    const report = buildReport(jobs, { preset: "custom", range: august }, TODAY);

    expect(report.totalValue).toBe(report.banks.reduce((sum, row) => sum + row.totalValue, 0));
    expect(report.totalValue).toBe(4_500_000);
  });
});

describe("assigneeStats", () => {
  it("คืนรายการว่างเมื่อไม่มีงาน", () => {
    expect(assigneeStats([], august, TODAY)).toEqual([]);
  });

  it("ไม่นับงานที่ส่งต่อทีม C แล้วเป็นงานในมือของผู้ประเมิน", () => {
    const waitingTeamC = openJob({
      id: "at-team-c",
      path: [
        ["intake", "2026-08-25T00:00:00.000Z"],
        ["assigned", "2026-08-26T00:00:00.000Z"],
        ["readyToSubmit", "2026-08-27T00:00:00.000Z"],
      ],
    });

    expect(assigneeStats([waitingTeamC], august, TODAY)).toEqual([
      { assignee: "สมชาย", label: "สมชาย", openJobs: 0, overdueJobs: 0, submitted: 0, handled: 1, averageHandlingDays: 1 },
    ]);
  });

  it("นับงานที่ถูกตีกลับเป็นสองช่วงของคนเดียวกัน", () => {
    expect(assigneeStats([reworkJob()], august, TODAY)[0]).toMatchObject({
      assignee: "สมชาย",
      handled: 2,
      submitted: 1,
      averageHandlingDays: 2,
    });
  });

  it("ผลรวมช่วงงานรายคนเท่ากับของทีม B เสมอ", () => {
    const jobs = [closedJob(), reworkJob({ assignee: "นภา" }), openJob({ assignee: "ปิยะ" })];
    const rows = assigneeStats(jobs, august, TODAY);
    const teamB = teamStats(jobs, august, TODAY).find((team) => team.team === "teamB");

    expect(rows.reduce((sum, row) => sum + row.handled, 0)).toBe(teamB?.handoffs);
  });

  it("รวมงานที่ยังไม่ระบุผู้ประเมินเป็นแถวเดียว", () => {
    const rows = assigneeStats([openJob({ assignee: "" }), openJob({ id: "open-2", assignee: "" })], august, TODAY);

    expect(rows).toEqual([
      { assignee: "", label: unassignedLabel, openJobs: 2, overdueJobs: 0, submitted: 0, handled: 0, averageHandlingDays: 0 },
    ]);
  });

  it("นับงานในมือที่เลยกำหนด และคืนศูนย์แทน NaN เมื่อยังไม่มีช่วงงานที่จบ", () => {
    const rows = assigneeStats([openJob({ due: "2026-08-27" })], august, TODAY);

    expect(rows[0]).toMatchObject({ openJobs: 1, overdueJobs: 1, handled: 0, averageHandlingDays: 0 });
  });

  it("เรียงลำดับคงที่ไม่ว่าลำดับข้อมูลเข้าจะเป็นอย่างไร", () => {
    const jobs = [
      openJob({ id: "x1", assignee: "นภา" }),
      openJob({ id: "x2", assignee: "ปิยะ" }),
      openJob({ id: "x3", assignee: "ปิยะ" }),
    ];
    const forward = assigneeStats(jobs, august, TODAY).map((row) => row.label);

    expect(forward).toEqual(["ปิยะ", "นภา"]);
    expect(assigneeStats([...jobs].reverse(), august, TODAY).map((row) => row.label)).toEqual(forward);
  });
});
