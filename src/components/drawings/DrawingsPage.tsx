"use client";

import { Copy, FileImage, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { type AppraisalJob } from "@/domain/appraisal";
import { createDrawing, drawingLabels, drawingTypes, housePlanStarterLabels, type DrawingDocument, type DrawingType, type HousePlanStarter } from "@/domain/drawings";
import { getJob, removeDrawing, saveDrawing, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { AccessBanner, Button, EmptyState, LinkButton, PageHeader, Panel, Select } from "../ui";
import { JobContext, MissingJob } from "../JobContext";
import { useAccess } from "../useAccess";
import { DrawingArtwork } from "./DrawingArtwork";

function emptyJob(): AppraisalJob | null { return null; }
function newId(): string { return globalThis.crypto?.randomUUID?.() ?? `drawing-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export function DrawingsPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { permission, team } = useAccess();
  const level = permission("drawings");
  const job = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
  const [type, setType] = useState<DrawingType>("room");
  const [starter, setStarter] = useState<HousePlanStarter>("single");
  const [error, setError] = useState("");

  if (!job) return <MissingJob />;
  const editable = (team === "teamB" || team === "admin") && canEdit(level) && (job.status === "assigned" || job.status === "changesRequested");

  function create() {
    try {
      const drawing = createDrawing(type, newId(), new Date().toISOString(), starter);
      saveDrawing(jobId, drawing);
      router.push(`/jobs/${jobId}/drawings/${drawing.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกแบบแปลงไม่สำเร็จ กรุณาตรวจพื้นที่จัดเก็บในเบราว์เซอร์");
    }
  }

  function duplicate(drawing: DrawingDocument) {
    try {
      saveDrawing(jobId, { ...drawing, id: newId(), title: `${drawing.title} (สำเนา)`, elements: drawing.elements.map((item) => ({ ...item, id: newId() })), includeInReport: false, updatedAt: new Date().toISOString() });
      setError("");
    } catch {
      setError("คัดลอกแบบไม่สำเร็จ กรุณาตรวจพื้นที่จัดเก็บในเบราว์เซอร์");
    }
  }

  function remove(drawing: DrawingDocument) {
    if (!window.confirm(`ลบแบบ “${drawing.title}” หรือไม่`)) return;
    try { removeDrawing(jobId, drawing.id); setError(""); }
    catch { setError("ลบแบบไม่สำเร็จ"); }
  }

  function toggleReport(drawing: DrawingDocument) {
    try { saveDrawing(jobId, { ...drawing, includeInReport: !drawing.includeInReport }); setError(""); }
    catch { setError("เปลี่ยนการแนบรายงานไม่สำเร็จ"); }
  }

  return (
    <>
      <PageHeader eyebrow={job.workflow.caseId || "งานประเมิน"} title="แบบแปลง" description="สร้างแผนผังประกอบงานประเมิน ตัวเลขระยะต้องกรอกเองและแบบเหล่านี้ไม่มีสเกล" />
      {!canView(level) ? <AccessBanner level="none" ownerLabel={ownerTeamLabel("drawings")} /> : !editable ? <AccessBanner level="read" ownerLabel={ownerTeamLabel("drawings")} /> : null}
      <JobContext job={job} />
      {editable ? <Panel className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="grid grow gap-1.5 text-sm font-semibold text-ink-soft">ประเภทแบบ
          <Select onChange={(event) => setType(event.target.value as DrawingType)} value={type}>{drawingTypes.map((value) => <option key={value} value={value}>{drawingLabels[value]}</option>)}</Select>
        </label>
        {type === "housePlan" ? <label className="grid grow gap-1.5 text-sm font-semibold text-ink-soft">แม่แบบ
          <Select onChange={(event) => setStarter(event.target.value as HousePlanStarter)} value={starter}>{(Object.keys(housePlanStarterLabels) as HousePlanStarter[]).map((value) => <option key={value} value={value}>{housePlanStarterLabels[value]}</option>)}</Select>
        </label> : null}
        <Button onClick={create} variant="primary"><Plus size={17} />สร้างแบบแปลง</Button>
      </Panel> : null}
      {error ? <p className="mb-4 rounded-control bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p> : null}
      {job.drawings.length === 0 ? <EmptyState title="ยังไม่มีแบบแปลง" description="เลือกประเภทแล้วสร้างแบบแรกเพื่อเริ่มจัดวางแผนผัง" /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {job.drawings.map((drawing) => <li key={drawing.id}>
            <Panel className="overflow-hidden">
              <Link aria-label={`เปิด ${drawing.title}`} href={`/jobs/${jobId}/drawings/${drawing.id}`}>
                <DrawingArtwork className="aspect-[10/7] w-full border-b border-line bg-white" drawing={drawing} />
              </Link>
              <div className="grid gap-3 p-4">
                <div><p className="text-xs font-semibold text-accent">{drawingLabels[drawing.type]}</p><h2 className="text-base font-bold break-hard">{drawing.title}</h2></div>
                <label className="flex min-h-11 items-center gap-2 text-sm"><input checked={drawing.includeInReport} disabled={!editable} onChange={() => toggleReport(drawing)} type="checkbox" />แนบในรายงาน</label>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/jobs/${jobId}/drawings/${drawing.id}`} size="sm"><FileImage size={15} />เปิดแบบ</LinkButton>
                  {editable ? <><Button aria-label={`คัดลอก ${drawing.title}`} onClick={() => duplicate(drawing)} size="sm"><Copy size={15} />คัดลอก</Button><Button aria-label={`ลบ ${drawing.title}`} onClick={() => remove(drawing)} size="sm" variant="ghost"><Trash2 size={15} />ลบ</Button></> : null}
                </div>
              </div>
            </Panel>
          </li>)}
        </ul>
      )}
    </>
  );
}
