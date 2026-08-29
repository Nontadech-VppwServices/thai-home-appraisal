import type { ReactNode } from "react";
import type { AssigneeStat, BankRow, StageStat, TeamStat, WipStage } from "@/domain/reporting";
import { formatBacklogDays, formatCount, formatDays } from "./format";
import { Badge } from "../ui";

/**
 * ตารางสรุปของหน้ารายงาน ทุกกราฟมีตารางคู่กันเสมอ
 * ตาม design-and-ci.md ที่ห้ามสื่อความหมายด้วยสีอย่างเดียว
 */

type Column<Row> = {
  key: string;
  head: string;
  /** ตัวเลขชิดขวาเพื่อให้เทียบหลักกันได้ */
  numeric?: boolean;
  cell: (row: Row) => ReactNode;
};

/**
 * ตารางบนจอกว้าง และการ์ดบนมือถือ ใช้คำนิยามคอลัมน์ชุดเดียวกัน
 * คอลัมน์แรกเป็นชื่อแถวเสมอ จึงถูกใช้เป็นหัวการ์ดบนมือถือ
 */
function DataTable<Row>({
  columns,
  rows,
  rowKey,
  label,
  empty,
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  label: string;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  const [title, ...rest] = columns;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-line bg-surface-2/70">
              {columns.map((column) => (
                <th
                  className={`px-3 py-2.5 text-xs font-bold tracking-wide whitespace-nowrap text-muted ${
                    column.numeric ? "text-right" : "text-left"
                  }`}
                  key={column.key}
                  scope="col"
                >
                  {column.head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-line/70 last:border-0 hover:bg-surface-2/60" key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={`px-3 py-3 text-sm break-hard ${
                      column.numeric ? "tnum text-right whitespace-nowrap" : "text-ink-soft"
                    }`}
                    key={column.key}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={label} className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li className="rounded-control border border-line bg-surface-2/40 p-3" key={rowKey(row)}>
            <div className="text-sm font-bold break-hard">{title.cell(row)}</div>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {rest.map((column) => (
                <div key={column.key}>
                  <dt className="text-xs font-semibold text-muted">{column.head}</dt>
                  <dd className="tnum mt-0.5 text-sm font-semibold break-hard">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/** งานค้างอยู่ที่ขั้นตอนไหน (REQ-INSIGHT-004) */
export function WipStageTable({ stages }: { stages: WipStage[] }) {
  return (
    <DataTable
      columns={[
        { key: "status", head: "ขั้นตอน", cell: (row) => row.statusLabel },
        { key: "team", head: "ทีมที่ถืออยู่", cell: (row) => row.teamLabel },
        { key: "count", head: "งานค้าง", numeric: true, cell: (row) => formatCount(row.count) },
        { key: "average", head: "ค้างเฉลี่ย", numeric: true, cell: (row) => formatDays(row.averageAgeDays) },
        { key: "oldest", head: "ค้างนานสุด", numeric: true, cell: (row) => formatDays(row.oldestDays) },
      ]}
      empty="ไม่มีงานค้างในขั้นตอนใดเลย"
      label="งานค้างแยกตามขั้นตอน"
      rowKey={(row) => row.status}
      rows={stages}
    />
  );
}

/** ขั้นตอนไหนช้า (REQ-INSIGHT-005) */
export function StageTimeTable({ stages }: { stages: StageStat[] }) {
  return (
    <DataTable
      columns={[
        { key: "status", head: "ขั้นตอน", cell: (row) => row.statusLabel },
        { key: "team", head: "ทีม", cell: (row) => row.teamLabel },
        { key: "entries", head: "จำนวนช่วง", numeric: true, cell: (row) => formatCount(row.entries) },
        { key: "median", head: "ค่ากลาง", numeric: true, cell: (row) => formatDays(row.medianDays) },
        { key: "average", head: "เฉลี่ย", numeric: true, cell: (row) => formatDays(row.averageDays) },
        { key: "p90", head: "p90", numeric: true, cell: (row) => formatDays(row.p90Days) },
        { key: "target", head: "เป้า", numeric: true, cell: (row) => formatDays(row.targetDays) },
        {
          key: "verdict",
          head: "เทียบเป้า",
          cell: (row) =>
            row.entries === 0 ? (
              <span className="text-muted">—</span>
            ) : (
              <Badge tone={row.overTarget ? "warning" : "success"}>
                {row.overTarget ? "ช้ากว่าเป้า" : "ตามเป้า"}
              </Badge>
            ),
        },
      ]}
      empty="ยังไม่มีงานผ่านขั้นตอนใดในช่วงนี้"
      label="เวลาที่ใช้ต่อขั้นตอน"
      rowKey={(row) => row.status}
      rows={stages}
    />
  );
}

/** แต่ละทีมจะทำเสร็จเมื่อไร */
export function TeamTable({ teams }: { teams: TeamStat[] }) {
  return (
    <DataTable
      columns={[
        { key: "team", head: "ทีม", cell: (row) => row.label },
        { key: "duty", head: "หน้าที่", cell: (row) => <span className="text-muted">{row.duty}</span> },
        { key: "handoffs", head: "ส่งงานต่อสำเร็จ", numeric: true, cell: (row) => formatCount(row.handoffs) },
        { key: "average", head: "เวลาเฉลี่ยต่อช่วง", numeric: true, cell: (row) => formatDays(row.averageHandlingDays) },
        { key: "open", head: "งานค้างในมือ", numeric: true, cell: (row) => formatCount(row.openJobs) },
        { key: "overdue", head: "เลยกำหนด", numeric: true, cell: (row) => formatCount(row.overdueJobs) },
        {
          key: "clear",
          head: "คาดว่าเคลียร์หมดใน",
          numeric: true,
          cell: (row) => formatBacklogDays(row.clearBacklogDays),
        },
      ]}
      empty="ยังไม่มีข้อมูลของทีมใดในช่วงนี้"
      label="ผลงานรายทีม"
      rowKey={(row) => row.team}
      rows={teams}
    />
  );
}

/** สรุปรายผู้ประเมิน (REQ-INSIGHT-007) */
export function AssigneeTable({ assignees }: { assignees: AssigneeStat[] }) {
  return (
    <DataTable
      columns={[
        { key: "assignee", head: "ผู้ประเมิน", cell: (row) => row.label },
        { key: "open", head: "งานในมือ", numeric: true, cell: (row) => formatCount(row.openJobs) },
        { key: "overdue", head: "เลยกำหนด", numeric: true, cell: (row) => formatCount(row.overdueJobs) },
        { key: "submitted", head: "ปิดในช่วงนี้", numeric: true, cell: (row) => formatCount(row.submitted) },
        { key: "handled", head: "ช่วงงานที่ทำจบ", numeric: true, cell: (row) => formatCount(row.handled) },
        { key: "average", head: "เวลาเฉลี่ยต่อช่วง", numeric: true, cell: (row) => formatDays(row.averageHandlingDays) },
      ]}
      empty="ยังไม่มีงานที่ระบุผู้ประเมินในช่วงนี้"
      label="สรุปรายผู้ประเมิน"
      rowKey={(row) => row.assignee}
      rows={assignees}
    />
  );
}

/** แยกตามธนาคาร */
export function BankTable({ banks }: { banks: BankRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "bank", head: "ธนาคาร", cell: (row) => row.bank },
        { key: "received", head: "งานเข้า", numeric: true, cell: (row) => formatCount(row.received) },
        { key: "submitted", head: "งานปิด", numeric: true, cell: (row) => formatCount(row.submitted) },
        {
          key: "value",
          head: "มูลค่างานที่ปิด",
          numeric: true,
          cell: (row) => `${formatCount(row.totalValue)} บาท`,
        },
      ]}
      empty="ยังไม่มีงานของธนาคารใดในช่วงนี้"
      label="สรุปแยกตามธนาคาร"
      rowKey={(row) => row.bank}
      rows={banks}
    />
  );
}
