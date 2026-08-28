import type {
  PriceReferenceSnapshot,
  ReferenceSearchCriteria,
  ReferenceSearchResult,
  SelectedPriceReference,
} from "@/domain/priceReferences";

/** Boundary สำหรับเปลี่ยนจาก localStorage เป็นฐานข้อมูลกลางใน production */
export interface PriceReferenceRepository {
  search(criteria: ReferenceSearchCriteria, asOf: string): Promise<ReferenceSearchResult[]>;
  findById(id: string): Promise<PriceReferenceSnapshot | null>;
  capture(snapshot: PriceReferenceSnapshot): Promise<PriceReferenceSnapshot>;
  select(jobId: string, selection: SelectedPriceReference): Promise<void>;
}

/** Provider ภายนอกต้องเป็น API/feed ที่มีสิทธิ์ใช้งาน หรือเป็น link-out เท่านั้น */
export interface ExternalPriceReferenceProvider {
  readonly name: string;
  readonly mode: "api" | "link-out";
  search(criteria: ReferenceSearchCriteria): Promise<PriceReferenceSnapshot[]>;
}

export type ExternalSearchLink = {
  label: string;
  description: string;
  href: string;
};

/** Prototype เปิดแหล่งภายนอกให้ผู้ใช้ตรวจเอง โดยยังไม่ scrape หรืออ้างว่ามี API */
export function externalSearchLinks(propertyType: string, address: string): ExternalSearchLink[] {
  const query = encodeURIComponent(`${propertyType} ${address} ราคา ขาย`);
  return [
    {
      label: "ค้นราคาประเมินกรมธนารักษ์",
      description: "ค้นราคาที่ดินและสิ่งปลูกสร้างจากบริการทางการ",
      href: "https://assessprice.treasury.go.th/",
    },
    {
      label: "ค้นรูปแปลง LandsMaps",
      description: "ตรวจตำแหน่งแปลงและข้อมูลประกอบจากกรมที่ดิน",
      href: "https://landsmaps.dol.go.th/",
    },
    {
      label: "ค้นประกาศบนอินเทอร์เน็ต",
      description: "ค้นประกาศใกล้เคียง แล้วนำข้อมูลที่ตรวจแล้วกลับมาบันทึก",
      href: `https://www.google.com/search?q=${query}`,
    },
  ];
}
