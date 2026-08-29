"use client";

import { Braces, CheckCircle2, KeyRound, Play, ServerOff } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { canEdit, canView, ownerTeamLabel, teamProfiles } from "@/domain/access";
import { calculateValuation } from "@/domain/appraisal";
import { demoActivityLabels, type DemoActivity } from "@/domain/activity";
import { listDemoActivities, recordDemoActivity, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { JobContext, MissingJob, useStoredJob } from "./JobContext";
import { useAccess } from "./useAccess";
import { AccessBanner, Badge, Button, Notice, PageHeader, Panel, PanelBody, PanelHead, Toast } from "./ui";

const NO_ACTIVITIES: DemoActivity[] = [];

export function IntegrationPage({ jobId }: { jobId: string }) {
  const job = useStoredJob(jobId);
  const activities = useSyncExternalStore(subscribeToJobs, listDemoActivities, emptyActivities)
    .filter((activity) => activity.jobId === jobId && activity.type === "integrationSimulated");
  const { permission, team } = useAccess();
  const level = permission("integration");
  const [toast, setToast] = useState("");

  if (!job) return <MissingJob />;
  const editable = canEdit(level);
  const valuation = calculateValuation(job.property, job.valuation);
  const payload = {
    mode: "demo",
    bankReference: job.workflow.caseId,
    bank: job.workflow.bank,
    status: job.status,
    property: {
      type: job.property.propertyType,
      address: job.property.address,
      usableAreaSqM: job.property.usableArea,
    },
    valuation: { method: job.valuation.method, priceThb: valuation.price },
    evidence: { photoCount: job.photos.length, referenceCount: job.selectedReferences.length },
  };

  function simulate() {
    if (!team || !editable) return;
    const reference = `SIM-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    recordDemoActivity("integrationSimulated", job!.id, team, reference);
    setToast(`จำลองสำเร็จ · ${reference}`);
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <>
      <PageHeader
        actions={<Button disabled={!editable} onClick={simulate} variant="primary"><Play size={15} />จำลองส่ง payload</Button>}
        description="ตรวจ payload และทดลอง flow การเชื่อมต่อโดยไม่เรียก API หรือส่งข้อมูลออกจากเครื่อง"
        eyebrow="ทีม C · Integration Sandbox"
        title="จำลองการเชื่อมต่อธนาคาร"
      />
      {!editable ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("integration")} /> : null}
      <JobContext job={job} />

      <section aria-label="สถานะการเชื่อมต่อ" className="mb-6 grid gap-3 md:grid-cols-3">
        <StatusCard icon={ServerOff} label="Endpoint" status="ยังไม่มี contract" tone="warning" />
        <StatusCard icon={KeyRound} label="Authentication" status="ยังไม่กำหนด" tone="warning" />
        <StatusCard icon={CheckCircle2} label="Demo payload" status="พร้อมจำลอง" tone="success" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <PanelHead aside={<Badge tone="warning"><Braces size={14} />ไม่ส่งจริง</Badge>} title="JSON payload preview" />
          <PanelBody className="bg-[#091321] p-0">
            <pre className="max-h-150 overflow-auto p-5 text-xs leading-relaxed text-slate-200 md:p-6"><code>{JSON.stringify(payload, null, 2)}</code></pre>
          </PanelBody>
        </Panel>

        <aside className="grid gap-4">
          <Notice>การกดจำลองจะสร้าง correlation ID และ activity log ใน localStorage เท่านั้น สถานะงานจะไม่เปลี่ยน</Notice>
          <Button disabled={!editable} onClick={simulate} variant="primary"><Play size={15} />Run simulation</Button>
          <Panel>
            <PanelHead aside={<Badge>{activities.length}</Badge>} title="ประวัติจำลอง" />
            <PanelBody>
              {activities.length === 0 ? <p className="text-sm text-muted">ยังไม่มีการจำลองสำหรับงานนี้</p> : (
                <ol className="grid gap-3">
                  {activities.slice(0, 6).map((activity) => (
                    <li className="border-b border-line pb-3 last:border-0 last:pb-0" key={activity.id}>
                      <div className="text-xs font-bold text-success">{demoActivityLabels[activity.type]}</div>
                      <div className="mt-1 text-sm font-semibold break-hard">{activity.reference}</div>
                      <div className="mt-1 text-xs text-muted">{teamProfiles[activity.actor].label} · {formatDateTime(activity.at)}</div>
                    </li>
                  ))}
                </ol>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
      <Toast message={toast} />
    </>
  );
}

function StatusCard({ icon: Icon, label, status, tone }: { icon: typeof ServerOff; label: string; status: string; tone: "success" | "warning" }) {
  return (
    <div className="flex items-center gap-3 rounded-panel border border-line bg-surface p-4 shadow-panel">
      <span className={`grid size-10 shrink-0 place-items-center rounded-control ${tone === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}><Icon size={19} /></span>
      <div><div className="text-xs font-bold text-muted">{label}</div><div className="mt-0.5 text-sm font-bold">{status}</div></div>
    </div>
  );
}

function emptyActivities(): DemoActivity[] {
  return NO_ACTIVITIES;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(date);
}
