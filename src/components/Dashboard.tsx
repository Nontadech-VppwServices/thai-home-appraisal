"use client";

import { Plus } from "lucide-react";
import { useSyncExternalStore } from "react";
import { calculateValuation, formatMoney, type AppraisalJob } from "@/domain/appraisal";
import { listJobs, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { EmptyState, LinkButton, PageHeader, Panel, StatusBadge } from "./ui";

const UNSET = "ยังไม่ระบุ";
const NO_JOBS: AppraisalJob[] = [];

export function Dashboard() {
  const jobs = useSyncExternalStore(subscribeToJobs, listJobs, emptyJobs);

  // คำนวณราคาครั้งเดียวต่องาน แล้วใช้ร่วมกันทั้งตาราง (desktop) และการ์ด (mobile)
  const rows = jobs.map((job) => ({ job, price: formatMoney(calculateValuation(job.property, job.valuation).price) }));
  return (
    <>
      <PageHeader
        actions={
          <LinkButton href="/jobs/new" variant="primary">
            <Plus size={16} />
            สร้างงานใหม่
          </LinkButton>
        }
        description="เปิดงานร่างเดิมหรือเริ่มงานใหม่ ข้อมูลทั้งหมดใน prototype นี้ยังอยู่ในเบราว์เซอร์เครื่องที่ใช้งาน"
        eyebrow="งานประเมินทั้งหมด"
        title="รายการงานประเมินในเครื่องนี้"
      />

      {rows.length === 0 ? (
        <EmptyState
          action={
            <LinkButton href="/jobs/new" variant="primary">
              <Plus size={16} />
              สร้างงานใหม่
            </LinkButton>
          }
          description="สร้างงานแรกเพื่อบันทึกเลขที่งาน ข้อมูลทรัพย์ รูปถ่าย และราคาประเมิน"
          title="ยังไม่มีงานประเมิน"
        />
      ) : (
        <>
          {/* Desktop: ตาราง */}
          <Panel className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2/70">
                    {["เลขที่งาน", "ผู้ว่าจ้าง", "วันที่ลงพื้นที่", "ธนาคาร", "ราคา", "สถานะ", ""].map((head) => (
                      <th
                        className="px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap text-muted"
                        key={head}
                        scope="col"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ job, price }) => (
                    <tr
                      className="border-b border-line/70 transition-colors duration-150 last:border-0 hover:bg-surface-2/60"
                      key={job.id}
                    >
                      <td className="px-4 py-3.5 text-sm font-bold break-hard">
                        {job.workflow.caseId || UNSET}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft">{job.workflow.clientName || UNSET}</td>
                      <td className="tnum px-4 py-3.5 text-sm whitespace-nowrap text-ink-soft">
                        {job.workflow.visitDate || UNSET}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft">{job.workflow.bank || UNSET}</td>
                      <td className="tnum px-4 py-3.5 text-sm font-bold whitespace-nowrap">{price}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge saved={job.status === "saved"} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <LinkButton href={`/jobs/${job.id}/workflow`} size="sm">
                          แก้ไข
                        </LinkButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Mobile: การ์ด */}
          <ul aria-label="รายการงานประเมิน" className="grid gap-3 md:hidden">
            {rows.map(({ job, price }) => (
              <li key={job.id}>
                <Panel className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-wide text-muted">เลขที่งาน</div>
                      <h2 className="mt-0.5 text-base font-bold break-hard">
                        {job.workflow.caseId || UNSET}
                      </h2>
                    </div>
                    <StatusBadge saved={job.status === "saved"} />
                  </div>

                  <div className="tnum mt-3 border-y border-line py-3 text-2xl font-extrabold break-hard">
                    {price}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <Meta label="ผู้ว่าจ้าง" value={job.workflow.clientName} />
                    <Meta label="วันที่ลงพื้นที่" value={job.workflow.visitDate} />
                    <Meta label="ธนาคาร" value={job.workflow.bank} />
                  </dl>

                  <LinkButton className="mt-4 w-full" href={`/jobs/${job.id}/workflow`} variant="primary">
                    แก้ไขงานนี้
                  </LinkButton>
                </Panel>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-hard">{value || UNSET}</dd>
    </div>
  );
}

function emptyJobs(): AppraisalJob[] {
  return NO_JOBS;
}
