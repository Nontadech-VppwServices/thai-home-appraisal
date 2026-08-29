"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { bankOptions, propertyTypeOptions } from "@/domain/appraisal";
import { createDraftJob, saveJob } from "@/infrastructure/storage/appraisalStore";
import { AccessBanner, Button, Field, FormSection, Input, PageHeader, Panel, Select, Textarea } from "./ui";
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
    router.push(`/jobs/${job.id}/intake`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        description="เปิดงานจากข้อมูลที่ธนาคารส่งมา จากนั้นไปมอบหมายผู้ประเมินในขั้นรับงาน"
        eyebrow="ทีม A · งานใหม่"
        title="บันทึกงานจากธนาคาร"
      />

      {readOnly ? (
        <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("newJob")} />
      ) : null}

      <Panel>
        <form onSubmit={submit}>
          <fieldset className="contents" disabled={readOnly}>
          <FormSection
            description="ข้อมูลชุดนี้ใช้ตรวจงานซ้ำและเป็นหัวข้อมูลของทุกขั้นตอน"
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
              <Field htmlFor="receivedAt" label="วันที่รับงาน">
                <Input
                  id="receivedAt"
                  onChange={(event) => setJob({ ...job, receivedAt: event.target.value })}
                  required
                  type="date"
                  value={job.receivedAt}
                />
              </Field>
              <Field htmlFor="dueDate" label="กำหนดส่ง">
                <Input
                  id="dueDate"
                  onChange={(event) => setJob({ ...job, dueDate: event.target.value })}
                  required
                  type="date"
                  value={job.dueDate}
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
              <Field htmlFor="propertyType" label="ประเภททรัพย์เบื้องต้น">
                <Select
                  id="propertyType"
                  onChange={(event) => setJob({ ...job, property: { ...job.property, propertyType: event.target.value } })}
                  value={job.property.propertyType}
                >
                  {propertyTypeOptions.map((type) => <option key={type}>{type}</option>)}
                </Select>
              </Field>
              <Field htmlFor="siteContact" label="ผู้ติดต่อเข้าพื้นที่">
                <Input
                  id="siteContact"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, siteContactName: event.target.value } })}
                  placeholder="ชื่อผู้ติดต่อ"
                  value={job.workflow.siteContactName}
                />
              </Field>
              <Field htmlFor="sitePhone" label="เบอร์ติดต่อ">
                <Input
                  id="sitePhone"
                  inputMode="tel"
                  onChange={(event) => setJob({ ...job, workflow: { ...job.workflow, siteContactPhone: event.target.value } })}
                  value={job.workflow.siteContactPhone}
                />
              </Field>
              <div className="md:col-span-2">
                <Field htmlFor="address" label="ที่อยู่ทรัพย์เบื้องต้น">
                  <Textarea
                    id="address"
                    onChange={(event) => setJob({ ...job, property: { ...job.property, address: event.target.value } })}
                    required
                    value={job.property.address}
                  />
                </Field>
              </div>
            </div>

            <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="primary">
              สร้างงานและไปมอบหมาย
            </Button>
          </FormSection>
          </fieldset>
        </form>
      </Panel>
    </div>
  );
}
