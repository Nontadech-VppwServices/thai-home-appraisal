"use client";

import { CalendarClock, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ownerTeamOf, statusLabels, type AppraisalJob } from "@/domain/appraisal";
import { teamProfiles } from "@/domain/access";
import { getJob, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { EmptyState, LinkButton, StatusBadge } from "./ui";

const phases = [
  { segment: "intake", label: "รับงาน", statuses: ["intake"], segments: ["intake"] },
  { segment: "workflow", label: "ประเมิน", statuses: ["assigned", "changesRequested"], segments: ["workflow", "property", "photos", "references", "valuation", "report"] },
  { segment: "review", label: "ตรวจสอบ", statuses: ["readyToSubmit"], segments: ["review"] },
  { segment: "handoff", label: "ส่งมอบ", statuses: ["submitted"], segments: ["export", "handoff", "integration"] },
] as const;

export function useStoredJob(jobId: string): AppraisalJob | null {
  return useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
}

export function MissingJob() {
  return (
    <EmptyState
      action={<LinkButton href="/jobs/new" variant="primary">สร้างงานใหม่</LinkButton>}
      description="งานอาจถูกล้างจากเบราว์เซอร์เครื่องนี้แล้ว"
      title="ไม่พบงานประเมินนี้"
    />
  );
}

export function JobContext({ job }: { job: AppraisalJob }) {
  const pathname = usePathname();
  const owner = ownerTeamOf(job.status);

  return (
    <section className="mb-6 overflow-hidden rounded-panel border border-line bg-surface shadow-panel print:hidden">
      <div className="flex flex-col gap-4 border-b border-line px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="break-hard text-base">{job.workflow.caseId || "ยังไม่ระบุเลขอ้างอิง"}</strong>
            <StatusBadge status={job.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} />กำหนดส่ง {job.dueDate || "ยังไม่ระบุ"}</span>
            <span className="inline-flex items-center gap-1.5"><UserRound size={14} />{job.assignee || "ยังไม่มอบหมาย"}</span>
            <span>ผู้รับผิดชอบ: {owner ? teamProfiles[owner].label : "ปิดงานแล้ว"}</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted">{statusLabels[job.status]}</span>
      </div>

      <nav aria-label="ภาพรวมสายงาน">
        <ol className="grid grid-cols-4">
          {phases.map((phase, index) => {
            const href = `/jobs/${job.id}/${phase.segment}`;
            const active = phase.segments.some((segment) => pathname === `/jobs/${job.id}/${segment}`);
            const statusIndex = phases.findIndex((item) => (item.statuses as readonly string[]).includes(job.status));
            const done = index < statusIndex;
            return (
              <li key={phase.segment}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-12 items-center justify-center gap-2 border-r border-line px-2 text-xs font-bold last:border-r-0 md:text-sm",
                    active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                  ].join(" ")}
                  href={href}
                >
                  <span className={[
                    "tnum grid size-5 shrink-0 place-items-center rounded-full text-[10px]",
                    active ? "bg-accent text-white" : done ? "bg-success-soft text-success" : "bg-surface-3 text-muted",
                  ].join(" ")}>{index + 1}</span>
                  <span className="hidden sm:inline">{phase.label}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </section>
  );
}

function emptyJob(): AppraisalJob | null {
  return null;
}
