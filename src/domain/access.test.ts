import { describe, expect, it } from "vitest";
import {
  canEdit,
  canView,
  defaultMatrix,
  menuCatalog,
  normalizeMatrix,
  permissionOf,
  teams,
  type MenuKey,
  type Team,
} from "./access";

/**
 * ตารางสิทธิ์ตาม REQ-ROLE-001 (docs/requirements/pipeline.md)
 * แต่ละแถวคือ "การกระทำ" ในเอกสาร map เป็นเมนูที่ใช้ทำสิ่งนั้น
 * ถ้า defaultMatrix เพี้ยนไปจาก requirement การทดสอบชุดนี้จะ fail
 */
const roleTable: { action: string; menus: MenuKey[]; allowed: Team[] }[] = [
  { action: "บันทึกงานจากธนาคารและแก้ข้อมูลอ้างอิงธนาคาร", menus: ["newJob", "intake", "workflow"], allowed: ["teamA"] },
  { action: "มอบหมายงานให้ผู้ประเมิน", menus: ["intake"], allowed: ["teamA"] },
  { action: "แก้ข้อมูลทรัพย์ รูปถ่าย ข้อมูลอ้างอิง และราคา", menus: ["property", "photos", "references", "valuation"], allowed: ["teamB"] },
  { action: "บันทึกการส่งธนาคาร", menus: ["handoff", "export", "integration"], allowed: ["teamC"] },
  { action: "ตีกลับงาน", menus: ["review"], allowed: ["teamA", "teamC"] },
];

describe("defaultMatrix ตรงกับตารางสิทธิ์ใน REQ-ROLE-001", () => {
  for (const { action, menus, allowed } of roleTable) {
    it(`${action}: อนุญาตเฉพาะ ${allowed.join(", ")}`, () => {
      for (const menu of menus) {
        for (const team of teams) {
          if (team === "admin") continue;
          expect({ menu, team, edit: canEdit(defaultMatrix[team][menu]) }).toEqual({
            menu,
            team,
            edit: allowed.includes(team),
          });
        }
      }
    });
  }

  it("ดูงานและรายงาน: ทุกทีมเห็นได้", () => {
    for (const team of teams) {
      expect(canView(defaultMatrix[team].jobs)).toBe(true);
      expect(canView(defaultMatrix[team].report)).toBe(true);
    }
  });

  it("เฉพาะผู้ดูแลระบบเข้าเมนูกำหนดสิทธิ์ได้", () => {
    expect(canEdit(defaultMatrix.admin.permissions)).toBe(true);
    for (const team of ["teamA", "teamB", "teamC"] as Team[]) {
      expect(canView(defaultMatrix[team].permissions)).toBe(false);
    }
  });

  it("ผู้ดูแลระบบแก้ไขได้ทุกเมนู", () => {
    for (const entry of menuCatalog) {
      expect(canEdit(defaultMatrix.admin[entry.key])).toBe(true);
    }
  });
});

describe("permissionOf", () => {
  it("คืน none เมื่อยังไม่ได้เลือกทีม", () => {
    expect(permissionOf(defaultMatrix, null, "jobs")).toBe("none");
  });

  it("คืนระดับสิทธิ์ของทีมที่ระบุ", () => {
    expect(permissionOf(defaultMatrix, "teamB", "property")).toBe("edit");
    expect(permissionOf(defaultMatrix, "teamB", "workflow")).toBe("read");
  });
});

describe("normalizeMatrix", () => {
  it("เติมค่าที่ขาดจาก defaultMatrix", () => {
    expect(normalizeMatrix({ teamA: { property: "edit" } as never })).toEqual({
      ...defaultMatrix,
      teamA: { ...defaultMatrix.teamA, property: "edit" },
    });
  });

  it("ทิ้งค่าที่ไม่ถูกต้องแล้วใช้ค่ามาตรฐานแทน", () => {
    expect(normalizeMatrix({ teamC: { export: "superuser" } as never }).teamC.export).toBe(
      defaultMatrix.teamC.export,
    );
  });

  it("คืนค่ามาตรฐานทั้งชุดเมื่อไม่มีข้อมูลเก่า", () => {
    expect(normalizeMatrix(null)).toEqual(defaultMatrix);
  });
});
