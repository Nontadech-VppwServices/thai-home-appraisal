import type { JobSummary } from "@/domain/reporting";
import { formatCount, formatDate, formatDays } from "./format";
import { LinkButton, StatusBadge } from "../ui";

/**
 * รายการงานที่ต้องตามต่อ (REQ-INSIGHT-004)
 *
 * `wipReport` คืนรายการแบบไม่จำกัดจำนวน โดยเฉพาะ `oldest` ที่คืนงานค้างทุกใบ
 * ที่นี่จึงตัดให้เหลือเท่าที่อ่านไหว แล้วบอกจำนวนทั้งหมดกำกับไว้
 */

const visibleRows = 5;

const UNSET = "ยังไม่ระบุ";

export function JobList({
  rows,
  metric,
  empty,
}: {
  rows: JobSummary[];
  /** ตัวเลขที่ทำให้งานติดรายการนี้ ต่างกันไปตามคำถามที่ลิสต์ตอบ */
  metric: { label: string; of: (row: JobSummary) => number };
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {rows.slice(0, visibleRows).map((row) => (
          <li
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-control border border-line bg-surface-2/40 px-3 py-2.5"
            key={row.id}
          >
            <div className="min-w-0">
              <div className="text-sm font-bold break-hard">{row.caseId || UNSET}</div>
              <div className="tnum mt-0.5 text-xs text-muted break-hard">
                {row.teamLabel} · {row.assignee || UNSET} · กำหนดส่ง {formatDate(row.dueDate)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-muted">{metric.label}</div>
                <div className="tnum text-sm font-bold whitespace-nowrap">{formatDays(metric.of(row))}</div>
              </div>
              <StatusBadge status={row.status} />
              <LinkButton href={`/jobs/${row.id}/workflow`} size="sm">
                เปิดงาน
              </LinkButton>
            </div>
          </li>
        ))}
      </ul>

      {rows.length > visibleRows ? (
        <p className="tnum text-xs text-muted">
          แสดง {formatCount(visibleRows)} จากทั้งหมด {formatCount(rows.length)} ใบ
        </p>
      ) : null}
    </div>
  );
}
