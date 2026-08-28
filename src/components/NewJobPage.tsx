"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { bankOptions } from "@/domain/appraisal";
import { createDraftJob, saveDraft } from "@/infrastructure/storage/appraisalStore";
import { Button, Field, FormSection } from "./ui";

export function NewJobPage() {
  const router = useRouter();
  const [job, setJob] = useState(() => createDraftJob());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDraft(job);
    router.push(`/jobs/${job.id}/workflow`);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Home appraisal / new case</div>
          <h1>สร้างงานประเมินใหม่</h1>
          <p className="intro">เริ่มจากข้อมูลที่ใช้ระบุงานก่อน แล้วค่อยกรอกข้อมูลทรัพย์ รูปถ่าย และวิธีประเมินในหน้าถัดไป</p>
        </div>
      </header>

      <section className="panel">
        <form onSubmit={submit}>
          <FormSection eyebrow="REQ-WORKFLOW-001" title="ข้อมูลงานเริ่มต้น">
            <div className="grid">
              <Field label="เลขที่งาน">
                <input required value={job.workflow.caseId} onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, caseId: event.target.value } })} placeholder="เช่น APP-2026-0001" />
              </Field>
              <Field label="วันที่ลงพื้นที่">
                <input required type="date" value={job.workflow.visitDate} onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, visitDate: event.target.value } })} />
              </Field>
              <Field label="ชื่อผู้ว่าจ้าง">
                <input required value={job.workflow.clientName} onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, clientName: event.target.value } })} placeholder="ชื่อบุคคลหรือองค์กร" />
              </Field>
              <Field label="ธนาคารปลายทาง">
                <select required value={job.workflow.bank} onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, bank: event.target.value } })}>
                  <option value="">เลือกธนาคาร</option>
                  {bankOptions.map((bank) => <option key={bank}>{bank}</option>)}
                </select>
              </Field>
            </div>
            <div className="action-row" style={{ marginTop: 20 }}>
              <Button type="submit" variant="primary">สร้างงานและไปต่อ</Button>
            </div>
          </FormSection>
        </form>
      </section>
    </>
  );
}
