"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { CycleTimeReport, StageStat, TeamStat, TrendPoint } from "@/domain/reporting";

/**
 * กราฟทั้งหมดของหน้ารายงาน (REQ-INSIGHT-003 ถึง REQ-INSIGHT-005)
 *
 * ไฟล์นี้เป็นที่เดียวที่ import recharts เพื่อไม่ให้ dependency หลุดไปหน้าอื่น
 *
 * สี: var() ใช้ใน SVG presentation attribute ไม่ได้ จึงตั้ง fill/stroke เป็น
 * `currentColor` แล้วคุมสีจริงด้วย class `text-*` ของ Tailwind ซึ่งสลับตามธีมเอง
 * ส่วนแกนและเส้นตารางคุมจาก block `.chart` ใน globals.css
 *
 * ไม่ใช้ <Legend> ของ recharts เพราะ swatch จะรับสีจากตัวอักษรไม่ใช่สีของเส้น
 * และปิด animation ทุกจุด เพราะ prefers-reduced-motion คุม JS ของ recharts ไม่ได้
 */

const axisTick = { fontSize: 12 };
const chartMargin = { top: 8, right: 8, bottom: 0, left: 0 };

function ChartFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-label={label} className="chart h-56 min-w-0 md:h-72" role="img">
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li className="flex items-center gap-1.5 text-xs font-semibold text-muted" key={item.label}>
          <span aria-hidden="true" className={`size-2 rounded-full ${item.className}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function tooltipContent(unit: string) {
  return function ChartTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
      <div className="tnum rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-raised">
        <div className="mb-1 font-bold text-ink">{String(label ?? "")}</div>
        {payload.map((entry) => (
          <div className="flex items-center justify-between gap-4 text-muted" key={String(entry.dataKey)}>
            <span>{entry.name}</span>
            <span className="font-bold text-ink">
              {entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  };
}

/** งานเข้าเทียบงานปิดตามช่วงเวลา — สองเส้นอ่านง่ายกว่าแท่งเมื่อมีจุดรายวัน 30 จุด */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  return (
    <ChartFrame label="กราฟแนวโน้มงานเข้าเทียบงานปิด">
      <LineChart data={points} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} tick={axisTick} />
        <YAxis allowDecimals={false} tick={axisTick} width={32} />
        <Tooltip content={tooltipContent("ใบ")} />
        <Line
          className="text-accent"
          dataKey="received"
          dot={false}
          isAnimationActive={false}
          name="งานเข้า"
          stroke="currentColor"
          strokeWidth={2}
          type="monotone"
        />
        <Line
          className="text-action"
          dataKey="submitted"
          dot={false}
          isAnimationActive={false}
          name="งานปิด"
          stroke="currentColor"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ChartFrame>
  );
}

/** ค่ากลางของเวลาที่ใช้ต่อขั้นตอน แท่งสีส้มคือขั้นตอนที่ช้ากว่าเป้าที่ตั้งไว้ */
export function StageChart({ stages }: { stages: StageStat[] }) {
  return (
    <ChartFrame label="กราฟเวลาที่ใช้ต่อขั้นตอน">
      <BarChart data={stages} layout="vertical" margin={chartMargin}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis allowDecimals={false} tick={axisTick} type="number" />
        <YAxis dataKey="statusLabel" tick={axisTick} type="category" width={104} />
        <Tooltip content={tooltipContent("วัน")} />
        <Bar dataKey="medianDays" fill="currentColor" isAnimationActive={false} name="ค่ากลาง" radius={[0, 6, 6, 0]}>
          {stages.map((stage) => (
            <Cell className={stage.overTarget ? "text-warning" : "text-accent"} key={stage.status} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/** การกระจายเวลาต่อหนึ่งใบงาน ถังคงที่ 5 ช่วง จึงไม่มีปัญหา label ชนกัน */
export function CycleChart({ distribution }: { distribution: CycleTimeReport["distribution"] }) {
  return (
    <ChartFrame label="กราฟการกระจายเวลาต่อหนึ่งใบงาน">
      <BarChart data={distribution} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} />
        <YAxis allowDecimals={false} tick={axisTick} width={32} />
        <Tooltip content={tooltipContent("ใบ")} />
        <Bar
          className="text-action"
          dataKey="count"
          fill="currentColor"
          isAnimationActive={false}
          name="จำนวนงาน"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}

/** เทียบงานที่ส่งต่อสำเร็จกับงานที่ยังค้าง หน่วยเดียวกันจึงอยู่แกนเดียวกันได้ */
export function TeamChart({ teams }: { teams: TeamStat[] }) {
  return (
    <ChartFrame label="กราฟเปรียบเทียบผลงานรายทีม">
      <BarChart data={teams} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} />
        <YAxis allowDecimals={false} tick={axisTick} width={32} />
        <Tooltip content={tooltipContent("ใบ")} />
        <Bar
          className="text-accent"
          dataKey="handoffs"
          fill="currentColor"
          isAnimationActive={false}
          name="ส่งงานต่อสำเร็จ"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          className="text-warning"
          dataKey="openJobs"
          fill="currentColor"
          isAnimationActive={false}
          name="งานค้างในมือ"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}
