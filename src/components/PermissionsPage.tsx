"use client";

import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import {
  canEdit,
  menuCatalog,
  permissionLabels,
  permissionLevels,
  teamProfiles,
  teams,
  type MenuKey,
  type PermissionLevel,
  type PermissionMatrix,
  type Team,
} from "@/domain/access";
import { resetMatrix, setPermission } from "@/infrastructure/storage/accessStore";
import {
  AccessBanner,
  Button,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  SegmentedControl,
  Toast,
} from "./ui";
import { useAccess } from "./useAccess";

const levelOptions = permissionLevels.map((level) => ({ value: level, label: permissionLabels[level] }));

export function PermissionsPage() {
  const { matrix, permission } = useAccess();
  const level = permission("permissions");
  const editable = canEdit(level);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2000);
  }

  function change(team: Team, menu: MenuKey, next: PermissionLevel) {
    setPermission(team, menu, next);
    showToast(`${teamProfiles[team].label} · ${menuLabel(menu)} → ${permissionLabels[next]}`);
  }

  function reset() {
    if (!window.confirm("คืนค่าสิทธิ์ทุกทีมกลับไปตามตารางมาตรฐานใน REQ-ROLE-001 หรือไม่")) return;
    resetMatrix();
    showToast("คืนค่าสิทธิ์มาตรฐานแล้ว");
  }

  return (
    <>
      <PageHeader
        actions={
          editable ? (
            <Button className="w-full sm:w-auto" onClick={reset}>
              <RotateCcw size={15} />
              คืนค่ามาตรฐาน
            </Button>
          ) : undefined
        }
        description="กำหนดว่าแต่ละทีมเห็นเมนูไหน และเข้าไปแล้วอ่านได้อย่างเดียวหรือแก้ไขได้ การเปลี่ยนมีผลทันที"
        eyebrow="ผู้ดูแลระบบ"
        title="กำหนดสิทธิ์ของแต่ละทีม"
      />

      {editable ? null : <AccessBanner level={level === "none" ? "none" : "read"} ownerLabel="ผู้ดูแลระบบ" />}

      <Notice>
        โหมด demo — สิทธิ์นี้บังคับที่ฝั่งเบราว์เซอร์เท่านั้น ยังไม่ใช่การบังคับสิทธิ์จริง
        ตาม <strong className="font-bold">REQ-ROLE-001</strong> ที่กำหนดให้ปฏิเสธคำขอที่ฝั่งเซิร์ฟเวอร์
      </Notice>

      {/* Desktop: ตาราง เมนู x ทีม */}
      <Panel className="mt-4 hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2/70">
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-muted" scope="col">
                  เมนู
                </th>
                {teams.map((team) => (
                  <th
                    className="w-52 px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap text-muted"
                    key={team}
                    scope="col"
                  >
                    {teamProfiles[team].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menuCatalog.map((entry) => (
                <tr className="border-b border-line/70 last:border-0" key={entry.key}>
                  <th className="px-4 py-3 text-sm font-semibold text-ink" scope="row">
                    {entry.label}
                  </th>
                  {teams.map((team) => (
                    <td className="px-4 py-3" key={team}>
                      <SegmentedControl
                        disabled={!editable}
                        label={`สิทธิ์ของ${teamProfiles[team].label} ในเมนู${entry.label}`}
                        onChange={(next) => change(team, entry.key, next)}
                        options={levelOptions}
                        value={cell(matrix, team, entry.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Mobile: การ์ดต่อหนึ่งเมนู ไม่ใช้ตาราง scroll แนวนอน */}
      <ul className="mt-4 grid gap-3 md:hidden">
        {menuCatalog.map((entry) => (
          <li key={entry.key}>
            <Panel>
              <PanelBody className="grid gap-3">
                <h2 className="text-base font-bold">{entry.label}</h2>
                {teams.map((team) => (
                  <div className="grid gap-1.5" key={team}>
                    <div className="text-xs font-bold text-muted">{teamProfiles[team].label}</div>
                    <SegmentedControl
                      disabled={!editable}
                      label={`สิทธิ์ของ${teamProfiles[team].label} ในเมนู${entry.label}`}
                      onChange={(next) => change(team, entry.key, next)}
                      options={levelOptions}
                      value={cell(matrix, team, entry.key)}
                    />
                  </div>
                ))}
              </PanelBody>
            </Panel>
          </li>
        ))}
      </ul>

      <Toast message={toast} />
    </>
  );
}

function cell(matrix: PermissionMatrix, team: Team, menu: MenuKey): PermissionLevel {
  return matrix[team][menu];
}

function menuLabel(menu: MenuKey): string {
  return menuCatalog.find((entry) => entry.key === menu)?.label ?? menu;
}
