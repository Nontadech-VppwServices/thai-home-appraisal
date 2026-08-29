"use client";

import { AlertTriangle, Database, KeyRound, LockKeyhole, ShieldCheck, TimerReset } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { canEdit, canView, menuCatalog, ownerTeamLabel, permissionLabels, teamProfiles, teams } from "@/domain/access";
import { demoActivityLabels, type DemoActivity, type DemoActivityType } from "@/domain/activity";
import type { AppraisalJob } from "@/domain/appraisal";
import { listDemoActivities, listJobs, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { useAccess } from "./useAccess";
import { AccessBanner, Badge, LinkButton, Notice, PageHeader, Panel, PanelBody, PanelHead, Select } from "./ui";

const NO_ACTIVITIES: DemoActivity[] = [];
const NO_JOBS: AppraisalJob[] = [];
const activityTypes = Object.entries(demoActivityLabels) as Array<[DemoActivityType, string]>;

export function SecurityPage() {
  const { matrix, permission } = useAccess();
  const level = permission("security");
  const activities = useSyncExternalStore(subscribeToJobs, listDemoActivities, emptyActivities);
  const jobs = useSyncExternalStore(subscribeToJobs, listJobs, emptyJobs);
  const [filter, setFilter] = useState<"all" | DemoActivityType>("all");
  const jobLabels = useMemo(() => new Map(jobs.map((job) => [job.id, job.workflow.caseId || job.id])), [jobs]);
  const visibleActivities = filter === "all" ? activities : activities.filter((activity) => activity.type === filter);

  return (
    <>
      <PageHeader
        actions={canEdit(level) ? <LinkButton href="/permissions" variant="primary">กำหนดสิทธิ์รายเมนู</LinkButton> : undefined}
        description="แสดงข้อเท็จจริงด้านความปลอดภัยของ prototype และกิจกรรมที่บันทึกในเบราว์เซอร์เครื่องนี้"
        eyebrow="ผู้ดูแลระบบ · Security posture"
        title="ความปลอดภัยและบันทึกกิจกรรม"
      />
      {!canEdit(level) ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("security")} /> : null}
      <Notice>หน้านี้ไม่อ้างว่าระบบพร้อม production — login, authorization, encryption, retention และ audit log จริงยังต้องทำที่ backend</Notice>

      <section aria-label="สถานะความปลอดภัย" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PostureCard icon={KeyRound} label="Authentication" status="Demo login" description="เลือกทีมโดยไม่ยืนยันตัวตน" />
        <PostureCard icon={ShieldCheck} label="Authorization" status="Client-side" description="ซ่อนและล็อก UI ใน browser" />
        <PostureCard icon={Database} label="Data storage" status="Local browser" description="ยังไม่มีฐานข้อมูลกลางหรือ encryption" />
        <PostureCard icon={TimerReset} label="Retention" status="Not enforced" description="ยังไม่มีนโยบายลบข้อมูลอัตโนมัติ" />
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <PanelHead
            aside={
              <div className="w-full sm:w-52">
                <Select aria-label="กรองกิจกรรม" onChange={(event) => setFilter(event.target.value as "all" | DemoActivityType)} value={filter}>
                  <option value="all">กิจกรรมทั้งหมด</option>
                  {activityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div>
            }
            title="Activity log ในเครื่องนี้"
          />
          {visibleActivities.length === 0 ? (
            <PanelBody><p className="text-sm text-muted">ยังไม่มีกิจกรรมตามตัวกรองนี้ ลองมอบหมาย ส่งตรวจ export หรือจำลอง integration ก่อน</p></PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse text-left">
                <thead><tr className="border-b border-line bg-surface-2/70">{["เวลา", "กิจกรรม", "งาน", "ผู้ทำ", "อ้างอิง", "ผล"].map((label) => <th className="px-4 py-3 text-xs font-bold text-muted" key={label}>{label}</th>)}</tr></thead>
                <tbody>
                  {visibleActivities.map((activity) => (
                    <tr className="border-b border-line/70 last:border-0" key={activity.id}>
                      <td className="tnum px-4 py-3 text-xs whitespace-nowrap text-muted">{formatDateTime(activity.at)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{demoActivityLabels[activity.type]}</td>
                      <td className="px-4 py-3 text-sm break-hard">{activity.jobId ? jobLabels.get(activity.jobId) ?? activity.jobId : "—"}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{teamProfiles[activity.actor].label}</td>
                      <td className="px-4 py-3 text-xs break-hard text-muted">{activity.reference || "—"}</td>
                      <td className="px-4 py-3"><Badge tone={activity.result === "success" ? "success" : "danger"}>{activity.result === "success" ? "สำเร็จ" : "ล้มเหลว"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <aside className="grid gap-4">
          <Panel>
            <PanelHead title="ภาพรวมสิทธิ์" />
            <PanelBody className="grid gap-4">
              {teams.map((team) => {
                const counts = menuCatalog.reduce((result, menu) => {
                  result[matrix[team][menu.key]] += 1;
                  return result;
                }, { none: 0, read: 0, edit: 0 });
                return (
                  <div className="border-b border-line pb-4 last:border-0 last:pb-0" key={team}>
                    <div className="text-sm font-bold">{teamProfiles[team].label}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["edit", "read", "none"] as const).map((permissionLevel) => <Badge key={permissionLevel}>{permissionLabels[permissionLevel]} {counts[permissionLevel]}</Badge>)}
                    </div>
                  </div>
                );
              })}
              {canEdit(level) ? <LinkButton href="/permissions">เปิดตารางสิทธิ์</LinkButton> : null}
            </PanelBody>
          </Panel>

          <div className="flex gap-3 rounded-panel border border-warning/30 bg-warning-soft p-4 text-warning">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p className="text-sm leading-relaxed">Activity log นี้แก้ไขหรือล้างได้จาก Developer Tools จึงใช้เป็น audit evidence จริงไม่ได้</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function PostureCard({ icon: Icon, label, status, description }: { icon: typeof LockKeyhole; label: string; status: string; description: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3"><span className="grid size-9 place-items-center rounded-control bg-warning-soft text-warning"><Icon size={18} /></span><Badge tone="warning">ต้องพัฒนาต่อ</Badge></div>
      <div className="mt-4 text-xs font-bold text-muted">{label}</div><div className="mt-1 text-base font-extrabold">{status}</div><p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function emptyActivities(): DemoActivity[] {
  return NO_ACTIVITIES;
}

function emptyJobs(): AppraisalJob[] {
  return NO_JOBS;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(date);
}
