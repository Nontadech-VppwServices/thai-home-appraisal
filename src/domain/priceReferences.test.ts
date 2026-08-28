import { describe, expect, it } from "vitest";
import {
  createPriceReferenceRevision,
  priceReferenceDedupeKey,
  resolvePriceReferenceCapture,
  searchPriceReferences,
  summarizePriceReferences,
  type PriceReferenceSnapshot,
} from "./priceReferences";

function reference(overrides: Partial<PriceReferenceSnapshot> = {}): PriceReferenceSnapshot {
  return {
    id: "ref-1",
    revisionOf: null,
    sourceCategory: "market",
    providerName: "ตลาดตัวอย่าง",
    sourceUrl: "https://example.com/listing/1",
    externalReference: "listing-1",
    originalJobId: "",
    propertyType: "บ้านเดี่ยว",
    address: "กรุงเทพฯ",
    latitude: "13.7563",
    longitude: "100.5018",
    totalPrice: 4_000_000,
    unitPrice: 30_000,
    unit: "perSqM",
    landArea: 50,
    usableArea: 130,
    observedAt: "2026-08-01",
    capturedAt: "2026-08-28T10:00:00.000Z",
    capturedBy: "teamB",
    ...overrides,
  };
}

describe("searchPriceReferences", () => {
  it("กรองตามประเภท รัศมี 5 กม. และย้อนหลัง 24 เดือน", () => {
    const results = searchPriceReferences(
      [
        reference(),
        reference({ id: "far", externalReference: "far", latitude: "13.85", observedAt: "2026-08-01" }),
        reference({ id: "old", externalReference: "old", observedAt: "2024-07-01" }),
        reference({ id: "wrong-type", externalReference: "wrong", propertyType: "โรงงาน / โกดัง" }),
      ],
      {
        latitude: "13.7563",
        longitude: "100.5018",
        radiusKm: 5,
        maxAgeMonths: 24,
        propertyType: "บ้านเดี่ยว",
        sourceCategory: "market",
      },
      "2026-08-28T12:00:00.000Z",
    );

    expect(results.map((result) => result.reference.id)).toEqual(["ref-1"]);
    expect(results[0].distanceKm).toBe(0);
  });

  it("ไม่ค้นตามรัศมีเมื่อไม่มีพิกัดต้นทาง", () => {
    expect(searchPriceReferences([reference()], {
      latitude: "",
      longitude: "",
      radiusKm: 5,
      maxAgeMonths: 24,
      propertyType: "บ้านเดี่ยว",
      sourceCategory: "all",
    }, "2026-08-28")).toEqual([]);
  });
});

describe("summarizePriceReferences", () => {
  it("คำนวณ median จำนวนคู่/คี่ และไม่รวมคนละ source หรือหน่วย", () => {
    const summaries = summarizePriceReferences([
      reference({ id: "a", externalReference: "a", totalPrice: 3_000_000, unitPrice: 20_000 }),
      reference({ id: "b", externalReference: "b", totalPrice: 4_000_000, unitPrice: 30_000 }),
      reference({ id: "c", externalReference: "c", totalPrice: 8_000_000, unitPrice: 40_000 }),
      reference({ id: "official", externalReference: "official", sourceCategory: "official", totalPrice: 1_000_000, unitPrice: 10_000, unit: "perSqWah" }),
    ]);

    expect(summaries).toContainEqual({
      sourceCategory: "market",
      unit: "total",
      count: 3,
      minimum: 3_000_000,
      median: 4_000_000,
      maximum: 8_000_000,
    });
    expect(summaries).toContainEqual({
      sourceCategory: "market",
      unit: "perSqM",
      count: 3,
      minimum: 20_000,
      median: 30_000,
      maximum: 40_000,
    });
    expect(summaries).toContainEqual({
      sourceCategory: "official",
      unit: "perSqWah",
      count: 1,
      minimum: 10_000,
      median: 10_000,
      maximum: 10_000,
    });
  });

  it("หา median ของจำนวนคู่", () => {
    const summary = summarizePriceReferences([
      reference({ id: "a", externalReference: "a", totalPrice: 2_000_000, unitPrice: 0, unit: "none" }),
      reference({ id: "b", externalReference: "b", totalPrice: 4_000_000, unitPrice: 0, unit: "none" }),
    ])[0];
    expect(summary.median).toBe(3_000_000);
  });
});

describe("snapshot lifecycle", () => {
  it("ใช้ provider + external reference ป้องกันข้อมูลซ้ำ", () => {
    expect(priceReferenceDedupeKey(reference())).toBe(priceReferenceDedupeKey(reference({ id: "another", sourceUrl: "https://other.example" })));
    expect(resolvePriceReferenceCapture([reference()], reference({ id: "another" })).id).toBe("ref-1");
  });

  it("ปฏิเสธการเขียนทับ id เดิม และสร้าง revision ใหม่ได้", () => {
    expect(() => resolvePriceReferenceCapture([reference()], reference({ totalPrice: 5_000_000, externalReference: "changed" }))).toThrow("snapshot เดิมแก้ไขไม่ได้");

    const revision = createPriceReferenceRevision(reference(), { totalPrice: 5_000_000 }, {
      id: "ref-2",
      capturedAt: "2026-08-29T10:00:00.000Z",
      capturedBy: "teamB",
    });
    expect(revision).toMatchObject({ id: "ref-2", revisionOf: "ref-1", totalPrice: 5_000_000 });
  });
});
