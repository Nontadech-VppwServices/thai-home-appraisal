"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { bankOptions } from "@/domain/appraisal";
import { createDraftJob, saveJob } from "@/infrastructure/storage/appraisalStore";
import { AccessBanner, Button, Field, FormSection, Input, PageHeader, Panel, Select } from "./ui";
import { useAccess } from "./useAccess";

export function NewJobPage() {
  const router = useRouter();
  const { permission } = useAccess();
  const level = permission("newJob");
  const readOnly = !canEdit(level);
  const [job, setJob] = useState(() => createDraftJob());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    saveJob(job);
    router.push(`/jobs/${job.id}/workflow`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        description="เริ่มจากข้อมูลที่ใช้ระบุงานก่อน แล้วค่อยกรอกข้อมูลทรัพย์ รูปถ่าย และวิธีประเมินในหน้าถัดไป"
        eyebrow="งานใหม่"
        title="สร้างงานประเมินใหม่"
      />

      {readOnly ? (
        <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("newJob")} />
      ) : null}

      <Panel>
        <form onSubmit={submit}>
          <fieldset className="contents" disabled={readOnly}>
          <FormSection
            description="ข้อมูลสี่ช่องนี้ใช้ระบุงานในรายการ และแก้ไขภายหลังได้ตลอดที่ยังเป็นแบบร่าง"
            title="ข้อมูลงานเริ่มต้น"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="caseId" label="เลขที่งาน">
                <Input
                  id="caseId"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, caseId: event.target.value } })}
                  placeholder="เช่น APP-2026-0001"
                  required
                  value={job.workflow.caseId}
                />
              </Field>
              <Field htmlFor="visitDate" label="วันที่ลงพื้นที่">
                <Input
                  id="visitDate"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, visitDate: event.target.value } })}
                  required
                  type="date"
                  value={job.workflow.visitDate}
                />
              </Field>
              <Field htmlFor="clientName" label="ชื่อผู้ว่าจ้าง">
                <Input
                  id="clientName"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, clientName: event.target.value } })}
                  placeholder="ชื่อบุคคลหรือองค์กร"
                  required
                  value={job.workflow.clientName}
                />
              </Field>
              <Field htmlFor="bank" label="ธนาคารปลายทาง">
                <Select
                  id="bank"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, bank: event.target.value } })}
                  required
                  value={job.workflow.bank}
                >
                  <option value="">เลือกธนาคาร</option>
                  {bankOptions.map((bank) => (
                    <option key={bank}>{bank}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="primary">
              สร้างงานและไปต่อ
            </Button>
          </FormSection>
          </fieldset>
        </form>
      </Panel>
    </div>
  );
}
