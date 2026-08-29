"use client";

import { DatabaseZap, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { canEdit } from "@/domain/access";
import { formatMoney, type AppraisalJob } from "@/domain/appraisal";
import { createDemoJobs, demoJobCount, isDemoJob } from "@/domain/demoJobs";
import {
  addDays,
  buildReport,
  resolveRange,
  staleAfterDays,
  type DateRange,
  type RangePreset,
} from "@/domain/reporting";
import {
  hasLoadedDemoBefore,
  listJobs,
  rememberDemoLoaded,
  removeJobs,
  saveJobs,
  subscribeToJobs,
  todayISO,
} from "@/infrastructure/storage/appraisalStore";
import {
  AccessBanner,
  Button,
  EmptyState,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHead,
  StatCard,
  Toast,
} from "../ui";
import { useAccess } from "../useAccess";
import { ChartLegend, CycleChart, StageChart, TeamChart, TrendChart } from "./InsightsCharts";
import { InsightsFilters } from "./InsightsFilters";
import { JobList } from "./InsightsJobLists";
import { AssigneeTable, BankTable, StageTimeTable, TeamTable, WipStageTable } from "./InsightsTables";
import { formatCount, formatDays, formatPercent } from "./format";

const NO_JOBS: AppraisalJob[] = [];

function emptyJobs(): AppraisalJob[] {
  return NO_JOBS;
}

/**
 * เปิดหน้านี้ครั้งแรกบนเบราว์เซอร์ที่ยังไม่มีงานตัวอย่าง จะโหลดให้เอง
 *
 * เช็คว่า "ยังไม่มีงานตัวอย่าง" ไม่ใช่ "ไม่มีงานเลย" เพราะงานจริงเพียงใบเดียว
 * ไม่ควรทำให้หน้ารายงานว่างเปล่า และงานตัวอย่างใช้ id ขึ้นต้น demo- จึงไม่ชนกับงานจริง
 *
 * `hasLoadedDemoBefore` คือตัวเดียวที่หยุดการโหลดถาวร ใช้เคารพการที่ผู้ใช้กดล้างไปแล้ว
 */
function shouldAutoLoadDemo(): boolean {
  if (typeof window === "undefined" || hasLoadedDemoBefore()) return false;
  return !listJobs().some(isDemoJob);
}

/**
 * รายงานภาพรวมสำหรับผู้ดูแลระบบ (REQ-INSIGHT-001 ถึง REQ-INSIGHT-007)
 *
 * ตัวเลขทั้งหมดมาจาก `buildReport` ซึ่งเป็น pure function หน้านี้ทำหน้าที่แค่
 * เลือกช่วงเวลา ส่งข้อมูลเข้าไป และจัดวางผลลัพธ์ ไม่คำนวณอะไรเองเพิ่ม
 */
export function InsightsPage() {
  const { hydrated, permission } = useAccess();
  const level = permission("insights");
  const canManage = canEdit(level);
  const jobs = useSyncExternalStore(subscribeToJobs, listJobs, emptyJobs);

  // ตรึงวันนี้ไว้ตั้งแต่ mount เพื่อให้ตัวเลขนิ่งตลอดเซสชัน แม้ข้ามเที่ยงคืน
  const [asOf] = useState(todayISO);
  // ตัวอย่างย้อนหลังราวครึ่งปี ถ้าเริ่มที่ 30 วันกราฟจะดูว่างจนเหมือนพัง
  const [preset, setPreset] = useState<RangePreset>(() => (shouldAutoLoadDemo() ? "year" : "month"));
  const [custom, setCustom] = useState<DateRange>(() => ({ from: addDays(todayISO(), -29), to: todayISO() }));

  const range = useMemo(() => resolveRange(preset, asOf, custom), [preset, asOf, custom]);
  const report = useMemo(() => buildReport(jobs, { preset, range }, asOf), [jobs, preset, range, asOf]);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const autoLoadDone = useRef(false);
  const demoCount = jobs.filter(isDemoJob).length;

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2500);
  }

  function loadDemo(): boolean {
    try {
      saveJobs(createDemoJobs({ today: asOf }));
    } catch {
      showToast("พื้นที่เก็บข้อมูลในเบราว์เซอร์ไม่พอ ลองลบรูปถ่ายในงานเก่าก่อน");
      return false;
    }
    rememberDemoLoaded();
    // งานตัวอย่างย้อนหลังได้ถึงราวครึ่งปี ถ้าคงช่วง 30 วันไว้จะเห็นข้อมูลน้อยจนดูเหมือนพัง
    setPreset("year");
    return true;
  }

  function seedDemo() {
    if (loadDemo()) showToast(`โหลดข้อมูลตัวอย่าง ${formatCount(demoJobCount)} ใบแล้ว`);
  }

  function clearDemo() {
    if (!window.confirm(`ล้างข้อมูลตัวอย่าง ${demoCount} ใบออกจากเบราว์เซอร์นี้หรือไม่ งานจริงจะไม่ถูกลบ`)) return;
    // จำไว้ด้วย ไม่งั้นรอบหน้าที่เปิดหน้านี้จะโหลดตัวอย่างกลับมาเองทันที
    rememberDemoLoaded();
    showToast(`ล้างข้อมูลตัวอย่าง ${formatCount(removeJobs(isDemoJob))} ใบแล้ว`);
  }

  /**
   * โหลดข้อมูลตัวอย่างให้เองในการเปิดครั้งแรก (REQ-INSIGHT-006)
   *
   * ไม่ผูกกับสิทธิ์ เพราะเป็นการเตรียมข้อมูล demo ของ prototype ไม่ใช่การแก้งานจริง
   * ถ้าผูกกับสิทธิ์ ทีม A/B/C ที่เปิด URL ตรงจะเห็นหน้าเปล่าโดยไม่มีอะไรให้ดูเลย
   *
   * เขียนลง store อย่างเดียว ไม่แตะ state ของ React — store จะ dispatch event
   * ให้ useSyncExternalStore วาดใหม่เอง ส่วนช่วงเวลาถูกตั้งไว้ตั้งแต่ตอน initial state
   */
  useEffect(() => {
    if (autoLoadDone.current || !hydrated) return;
    autoLoadDone.current = true;
    if (!shouldAutoLoadDemo()) return;
    try {
      saveJobs(createDemoJobs({ today: asOf }));
      rememberDemoLoaded();
    } catch {
      // เบราว์เซอร์เก็บข้อมูลไม่พอ ปล่อยให้หน้าแสดง empty state แล้วให้ผู้ใช้กดปุ่มเอง
    }
  }, [hydrated, asOf]);

  return (
    <>
      <PageHeader
        actions={
          canManage ? (
            <>
              <Button className="w-full sm:w-auto" onClick={seedDemo}>
                <DatabaseZap size={15} />
                โหลดข้อมูลตัวอย่าง
              </Button>
              <Button className="w-full sm:w-auto" disabled={demoCount === 0} onClick={clearDemo} variant="danger">
                <Trash2 size={15} />
                ล้างข้อมูลตัวอย่าง
              </Button>
            </>
          ) : undefined
        }
        description="ดูว่างานค้างอยู่ที่ขั้นตอนไหน ขั้นตอนไหนช้ากว่าที่ควร หนึ่งใบงานใช้เวลากี่วัน และแต่ละทีมจะเคลียร์งานค้างหมดเมื่อไร"
        eyebrow="ผู้ดูแลระบบ"
        title="รายงานภาพรวมการทำงาน"
      />

      {canManage ? null : <AccessBanner level={level === "none" ? "none" : "read"} ownerLabel="ผู้ดูแลระบบ" />}

      <InsightsFilters
        asOf={asOf}
        custom={custom}
        onCustomChange={setCustom}
        onPresetChange={setPreset}
        preset={preset}
        range={range}
      />

      {hydrated && jobs.length === 0 ? (
        <EmptyState
          action={
            canManage ? (
              <Button onClick={seedDemo} variant="primary">
                <DatabaseZap size={16} />
                โหลดข้อมูลตัวอย่าง
              </Button>
            ) : undefined
          }
          description={
            canManage
              ? "รายงานอ่านข้อมูลจากเบราว์เซอร์เครื่องนี้ กดโหลดข้อมูลตัวอย่างเพื่อดูว่าหน้ารายงานแสดงอะไรบ้าง"
              : "ยังไม่มีงานในเบราว์เซอร์เครื่องนี้ให้สรุป"
          }
          title="ยังไม่มีข้อมูลให้สรุป"
        />
      ) : (
        <div className="grid gap-6">
          <section aria-label="ตัวเลขสรุป" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <StatCard label="งานเข้าในช่วงนี้" unit="ใบ" value={formatCount(report.received)} />
            <StatCard label="งานปิดในช่วงนี้" unit="ใบ" value={formatCount(report.submitted)} />
            <StatCard highlight label="งานค้างตอนนี้" unit="ใบ" value={formatCount(report.wip.openTotal)} />
            <StatCard
              label="ส่งตรงเวลา"
              unit={`จาก ${formatCount(report.onTime.total)} ใบที่ปิด`}
              value={formatPercent(report.onTime.rate)}
            />
            <StatCard
              label="ถูกตีกลับ"
              unit={`จาก ${formatCount(report.rework.total)} ใบที่รับเข้า`}
              value={formatPercent(report.rework.rate)}
            />
            <StatCard label="มูลค่างานที่ปิด" value={formatMoney(report.totalValue)} />
          </section>

          {demoCount > 0 ? (
            <Notice>
              <strong className="font-bold">กำลังแสดงข้อมูลตัวอย่างสำหรับ demo {formatCount(demoCount)} ใบ</strong> — ไม่ใช่งานจริง{" "}
              {canManage ? "กด “ล้างข้อมูลตัวอย่าง” ด้านบนเพื่อเอาออก" : "เข้าสู่ระบบเป็นผู้ดูแลระบบเพื่อล้างข้อมูลนี้ออก"}
            </Notice>
          ) : null}

          <Notice>
            <strong className="font-bold">เป้าเวลาต่อขั้นตอนและเกณฑ์งานค้างนาน ({staleAfterDays} วัน) ยังเป็นค่าสมมติ</strong>{" "}
            — ยังไม่ได้ยืนยันกับผู้ใช้งานจริงและไม่ใช่ SLA ของธนาคาร ใช้ชี้จุดที่ควรดูก่อนเท่านั้น
          </Notice>

          <Panel>
            <PanelHead
              aside={
                <ChartLegend
                  items={[
                    { label: "งานเข้า", className: "bg-accent" },
                    { label: "งานปิด", className: "bg-action" },
                  ]}
                />
              }
              description="งานเข้านับจากวันที่รับงาน ส่วนงานปิดนับจากเวลาที่ส่งธนาคาร"
              title="แนวโน้มงานเข้าเทียบงานปิด"
            />
            <PanelBody>
              <TrendChart points={report.trend} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              description="ค่า ณ ปัจจุบัน ไม่ถูกกรองด้วยช่วงเวลาที่เลือก และนับถึงสิ้นวันนี้"
              title="งานค้างอยู่ที่ไหน"
            />
            <PanelBody className="grid gap-4">
              <WipStageTable stages={report.wip.stages} />
            </PanelBody>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel>
              <PanelHead
                description="งานที่เลยกำหนดส่งแล้วและยังไม่ปิด"
                title="งานเลยกำหนดส่ง"
              />
              <PanelBody>
                <JobList
                  empty="ไม่มีงานที่เลยกำหนดส่ง"
                  metric={{ label: "เลยมาแล้ว", of: (row) => row.overdueDays }}
                  rows={report.wip.overdue}
                />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead
                description={`ไม่มีความเคลื่อนไหวเกิน ${staleAfterDays} วัน นับทั้งการเปลี่ยนสถานะและการแก้ข้อมูล`}
                title="งานที่ค้างนิ่ง"
              />
              <PanelBody>
                <JobList
                  empty="ทุกงานยังมีความเคลื่อนไหวอยู่"
                  metric={{ label: "นิ่งมาแล้ว", of: (row) => row.idleDays }}
                  rows={report.wip.stale}
                />
              </PanelBody>
            </Panel>
          </div>

          <Panel>
            <PanelHead
              aside={
                report.bottleneck ? (
                  <div className="tnum rounded-control bg-warning-soft px-3 py-2 text-sm font-bold text-warning">
                    คอขวด: {report.bottleneck.statusLabel} · ค่ากลาง {formatDays(report.bottleneck.medianDays)}
                  </div>
                ) : undefined
              }
              description="นับช่วงที่จบในช่วงที่เลือก และรวมช่วงที่ยังไม่จบเมื่อวันนี้อยู่ในช่วงด้วย ตัวเลขจึงไม่เท่ากับตารางผลงานรายทีม"
              title="ขั้นตอนไหนช้า"
            />
            <PanelBody className="grid gap-5">
              <StageChart stages={report.stages} />
              <StageTimeTable stages={report.stages} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              aside={
                <div className="tnum text-sm text-muted">
                  ค่ากลาง {formatDays(report.cycle.medianDays)} · p90 {formatDays(report.cycle.p90Days)}
                </div>
              }
              description={`วัดจากวันรับงานถึงเวลาที่ส่งธนาคาร จากงานที่ปิดในช่วงนี้ ${formatCount(report.cycle.completed)} ใบ`}
              title="หนึ่งใบงานใช้เวลากี่วัน"
            />
            <PanelBody className="grid gap-5">
              <CycleChart distribution={report.cycle.distribution} />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="เฉลี่ย" unit="วัน" value={formatCount(report.cycle.averageDays)} />
                <StatCard label="ค่ากลาง" unit="วัน" value={formatCount(report.cycle.medianDays)} />
                <StatCard label="เร็วที่สุด" unit="วัน" value={formatCount(report.cycle.fastestDays)} />
                <StatCard label="ช้าที่สุด" unit="วัน" value={formatCount(report.cycle.slowestDays)} />
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              aside={
                <ChartLegend
                  items={[
                    { label: "ส่งงานต่อสำเร็จ", className: "bg-accent" },
                    { label: "งานค้างในมือ", className: "bg-warning" },
                  ]}
                />
              }
              description="ประมาณการวันเคลียร์งานค้างคิดจากความเร็วในช่วงที่เลือก ถ้าไม่มีงานปิดเลยจะคำนวณไม่ได้"
              title="แต่ละทีมจะทำเสร็จเมื่อไร"
            />
            <PanelBody className="grid gap-5">
              <TeamChart teams={report.teams} />
              <TeamTable teams={report.teams} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              description="งานในมือนับเฉพาะงานที่ยังอยู่ในขั้นตอนของทีม B งานที่ส่งต่อทีม C แล้วถือเป็นคิวของทีม C"
              title="สรุปรายผู้ประเมิน"
            />
            <PanelBody>
              <AssigneeTable assignees={report.assignees} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead description="มูลค่าคิดจากงานที่ปิดในช่วงนี้เท่านั้น" title="แยกตามธนาคาร" />
            <PanelBody>
              <BankTable banks={report.banks} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead description="เรียงจากงานที่เปิดค้างนานที่สุด" title="งานที่เปิดค้างนานที่สุด" />
            <PanelBody>
              <JobList
                empty="ไม่มีงานค้างในระบบ"
                metric={{ label: "เปิดมาแล้ว", of: (row) => row.totalDays }}
                rows={report.wip.oldest}
              />
            </PanelBody>
          </Panel>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
