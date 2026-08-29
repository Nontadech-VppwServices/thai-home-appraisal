"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { appraisalCsvColumns, appraisalCsvFilename, appraisalToCsvRow, serializeAppraisalCsv } from "@/domain/exporting";
import { recordDemoActivity } from "@/infrastructure/storage/appraisalStore";
import { JobContext, MissingJob, useStoredJob } from "./JobContext";
import { useAccess } from "./useAccess";
import { AccessBanner, Badge, Button, Notice, PageHeader, Panel, PanelBody, PanelHead, Toast } from "./ui";

export function ExportPage({ jobId }: { jobId: string }) {
  const job = useStoredJob(jobId);
  const { permission, team } = useAccess();
  const level = permission("export");
  const [toast, setToast] = useState("");

  if (!job) return <MissingJob />;
  const row = appraisalToCsvRow(job);
  const filename = appraisalCsvFilename(job);
  const editable = canEdit(level);

  function download() {
    if (!team || !editable) return;
    const blob = new Blob([serializeAppraisalCsv(job!)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    recordDemoActivity("csvExported", job!.id, team, filename);
    setToast("ดาวน์โหลด CSV แล้ว");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <>
      <PageHeader
        actions={<Button disabled={!editable} onClick={download} variant="primary"><Download size={15} />ดาวน์โหลด CSV</Button>}
        description="ตรวจข้อมูลแบบ flattened record ก่อนดาวน์โหลดไฟล์ UTF-8 ที่เปิดด้วย Excel ได้"
        eyebrow="ทีม C · ส่งออกข้อมูล"
        title="ส่งออก CSV สำหรับตรวจสอบ"
      />
      {!editable ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("export")} /> : null}
      <JobContext job={job} />
      <Notice>ไฟล์นี้เป็น <strong>generic CSV สำหรับ demo</strong> ไม่ใช่ schema ที่ธนาคารรับรอง และไม่มีข้อมูลรูปภาพแบบ Data URL</Notice>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <PanelHead aside={<Badge tone="success">{appraisalCsvColumns.length} คอลัมน์</Badge>} title="ตัวอย่างข้อมูลที่จะส่งออก" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-collapse text-left">
              <thead><tr className="border-b border-line bg-surface-2/70"><th className="px-4 py-3 text-xs font-bold text-muted">Column</th><th className="px-4 py-3 text-xs font-bold text-muted">Value</th></tr></thead>
              <tbody>
                {appraisalCsvColumns.map((column) => (
                  <tr className="border-b border-line/70 last:border-0" key={column}>
                    <th className="px-4 py-3 font-mono text-xs font-semibold text-ink-soft" scope="row">{column}</th>
                    <td className="px-4 py-3 text-sm break-hard whitespace-pre-wrap">{String(row[column] ?? "") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <aside className="grid content-start gap-4">
          <Panel>
            <PanelBody className="grid gap-4">
              <div className="grid size-11 place-items-center rounded-control bg-success-soft text-success"><FileSpreadsheet size={21} /></div>
              <div><div className="text-xs font-bold text-muted">ชื่อไฟล์</div><div className="mt-1 text-sm font-bold break-hard">{filename}</div></div>
              <dl className="grid gap-3 text-sm">
                <Meta label="Encoding" value="UTF-8 with BOM" />
                <Meta label="จำนวนรายการ" value="1 งาน" />
                <Meta label="รูปภาพ" value={`${job.photos.length} รูป (นับจำนวนเท่านั้น)`} />
              </dl>
              <Button disabled={!editable} onClick={download} variant="primary"><Download size={15} />ดาวน์โหลดไฟล์</Button>
            </PanelBody>
          </Panel>
        </aside>
      </div>
      <Toast message={toast} />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-muted">{label}</dt><dd className="mt-0.5 font-semibold">{value}</dd></div>;
}
