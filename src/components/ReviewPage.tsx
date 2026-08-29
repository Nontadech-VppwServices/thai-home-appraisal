"use client";

import { ArrowRight, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { canEdit, canView, ownerTeamLabel, teamProfiles } from "@/domain/access";
import { calculateValuation, checklistItems, formatMoney, statusLabels, submissionReadiness } from "@/domain/appraisal";
import { transitionStoredJob } from "@/infrastructure/storage/appraisalStore";
import { JobContext, MissingJob, useStoredJob } from "./JobContext";
import { useAccess } from "./useAccess";
import {
  AccessBanner,
  Badge,
  Button,
  Field,
  LinkButton,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHead,
  StatCard,
  Textarea,
  Toast,
} from "./ui";

export function ReviewPage({ jobId }: { jobId: string }) {
  const job = useStoredJob(jobId);
  const { permission, team } = useAccess();
  const level = permission("review");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  if (!job) return <MissingJob />;

  const readiness = submissionReadiness(job);
  const valuation = calculateValuation(job.property, job.valuation);
  const canRequestChanges = canEdit(level) && Boolean(team) && job.status === "readyToSubmit";

  function requestChanges() {
    if (!team) return;
    try {
      transitionStoredJob(job!.id, "changesRequested", team, reason);
      setReason("");
      setError("");
      setToast("ตีกลับงานให้ทีม B แล้ว");
      window.setTimeout(() => setToast(""), 2400);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ตีกลับงานไม่สำเร็จ");
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <LinkButton href={`/jobs/${job.id}/report`}>เปิดรายงาน</LinkButton>
            {job.status === "readyToSubmit" && canView(permission("handoff")) ? (
              <LinkButton href={`/jobs/${job.id}/handoff`} variant="primary">ไปบันทึกการส่ง <ArrowRight size={15} /></LinkButton>
            ) : null}
          </>
        }
        description="ตรวจข้อมูลสำคัญ เหตุผลราคา และประวัติการส่งต่อก่อนส่งผลกลับธนาคาร"
        eyebrow="ทีม A / C · ตรวจสอบ"
        title="ตรวจความครบถ้วนของงาน"
      />
      {!canEdit(level) ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("review")} /> : null}
      <JobContext job={job} />

      <section aria-label="สรุปผลตรวจ" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="ความพร้อม" value={readiness.ready ? "พร้อม" : "ยังไม่ครบ"} />
        <StatCard label="Checklist" value={`${job.checks.filter(Boolean).length}/${checklistItems.length}`} />
        <StatCard label="รูปหลักฐาน" unit="รูป" value={String(job.photos.length)} />
        <StatCard highlight label="ราคาประเมิน" value={formatMoney(valuation.price)} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6">
          <Panel>
            <PanelHead aside={<Badge tone={readiness.ready ? "success" : "warning"}>{readiness.ready ? "ข้อมูลหลักครบ" : "ต้องแก้ไข"}</Badge>} title="รายการตรวจอัตโนมัติ" />
            <PanelBody>
              <ul className="grid gap-3">
                {readiness.items.map((item) => (
                  <li className="flex items-start gap-3 rounded-control border border-line bg-surface-2/50 p-3 text-sm" key={item.key}>
                    {item.complete ? <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={18} /> : <Circle className="mt-0.5 shrink-0 text-warning" size={18} />}
                    <span className={item.complete ? "font-semibold" : "text-muted"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Checklist จากผู้ประเมิน" />
            <PanelBody>
              <ul className="grid gap-3 md:grid-cols-2">
                {checklistItems.map((item, index) => (
                  <li className="flex items-start gap-3 text-sm leading-relaxed" key={item}>
                    {job.checks[index] ? <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={17} /> : <Circle className="mt-0.5 shrink-0 text-warning" size={17} />}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="ประวัติสถานะ" />
            <PanelBody>
              <ol className="grid gap-0">
                {[...job.statusHistory].reverse().map((entry, index) => (
                  <li className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0" key={`${entry.at}-${index}`}>
                    <span className="relative z-10 mt-1 size-3 rounded-full bg-accent ring-4 ring-accent-soft" />
                    {index < job.statusHistory.length - 1 ? <span className="absolute top-4 bottom-0 left-[5px] w-px bg-line-strong" /> : null}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{statusLabels[entry.to]}</strong>
                        <Badge>{teamProfiles[entry.actor].label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{entry.note || "ไม่มีหมายเหตุ"}</p>
                      <time className="tnum mt-1 block text-xs text-faint">{formatDateTime(entry.at)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>
        </div>

        <aside className="grid gap-4 xl:sticky xl:top-6">
          <Panel>
            <PanelHead title="ข้อมูลสำคัญ" />
            <PanelBody className="grid gap-3 text-sm">
              <Meta label="ธนาคาร" value={job.workflow.bank} />
              <Meta label="ผู้ประเมิน" value={job.assignee} />
              <Meta label="ที่อยู่" value={job.property.address} />
              <Meta label="วิธีประเมิน" value={valuation.basis} />
              <Meta label="หลักฐานราคา" value={`${job.selectedReferences.length} รายการ`} />
            </PanelBody>
          </Panel>

          {canRequestChanges ? (
            <Panel>
              <PanelHead aside={<Badge tone="warning">ต้องมีเหตุผล</Badge>} title="ตีกลับให้แก้ไข" />
              <PanelBody className="grid gap-4">
                <Field htmlFor="review-reason" label="เหตุผลที่ตีกลับ">
                  <Textarea id="review-reason" onChange={(event) => setReason(event.target.value)} placeholder="ระบุข้อมูลที่ต้องแก้ไขให้ทีม B เข้าใจ" value={reason} />
                </Field>
                {error ? <Notice>{error}</Notice> : null}
                <Button disabled={!reason.trim()} onClick={requestChanges} variant="danger"><RotateCcw size={15} />ตีกลับทีม B</Button>
              </PanelBody>
            </Panel>
          ) : (
            <Notice>{job.status === "readyToSubmit" ? "คุณมีสิทธิ์อ่านอย่างเดียวในขั้นตรวจสอบ" : `งานอยู่ในสถานะ ${statusLabels[job.status]} จึงยังตีกลับจากหน้านี้ไม่ได้`}</Notice>
          )}
        </aside>
      </div>
      <Toast message={toast} />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs font-bold text-muted">{label}</div><div className="mt-0.5 font-semibold break-hard">{value || "ยังไม่ระบุ"}</div></div>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
