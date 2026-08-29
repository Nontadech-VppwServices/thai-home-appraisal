"use client";

import { Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { bankOptions, intakeMissingFields, propertyTypeOptions, type AppraisalJob } from "@/domain/appraisal";
import { assignAppraisalJob, saveJob } from "@/infrastructure/storage/appraisalStore";
import { JobContext, MissingJob, useStoredJob } from "./JobContext";
import { useAccess } from "./useAccess";
import {
  AccessBanner,
  Badge,
  Button,
  Field,
  FormSection,
  Input,
  Notice,
  PageHeader,
  Panel,
  Select,
  Textarea,
  Toast,
} from "./ui";

export function IntakePage({ jobId }: { jobId: string }) {
  const storedJob = useStoredJob(jobId);
  const { permission, team } = useAccess();
  const level = permission("intake");
  const [job, setJob] = useState<AppraisalJob | null>(storedJob);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storedJob || job) return;
    window.setTimeout(() => setJob(storedJob), 0);
  }, [job, storedJob]);

  if (!job) return <MissingJob />;

  const editableStatus = job.status === "intake" || job.status === "assigned";
  const readOnly = !canEdit(level) || !editableStatus;
  const missing = intakeMissingFields(job);

  function updateWorkflow(key: keyof AppraisalJob["workflow"], value: string) {
    if (!job) return;
    setJob({ ...job, workflow: { ...job.workflow, [key]: value } });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function save() {
    if (!job || readOnly) return;
    saveJob(job);
    setError("");
    showToast("บันทึกข้อมูลรับงานแล้ว");
  }

  function assign() {
    if (!job || readOnly || !team) return;
    try {
      const next = assignAppraisalJob(job, team);
      setJob(next);
      setError("");
      showToast(job.status === "intake" ? "มอบหมายงานให้ทีม B แล้ว" : "อัปเดตผู้ประเมินแล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "มอบหมายงานไม่สำเร็จ");
    }
  }

  return (
    <>
      <PageHeader
        actions={readOnly ? undefined : (
          <>
            <Button onClick={save}><Save size={15} />บันทึก</Button>
            <Button disabled={missing.length > 0} onClick={assign} variant="primary">
              <Send size={15} />{job.status === "intake" ? "มอบหมายทีม B" : "อัปเดตผู้ประเมิน"}
            </Button>
          </>
        )}
        description="บันทึกข้อมูลที่ได้รับจากธนาคาร กำหนดผู้ประเมินและวันลงพื้นที่ก่อนส่งต่อให้ทีม B"
        eyebrow="ทีม A · รับงาน"
        title="รับงานและมอบหมายผู้ประเมิน"
      />
      {readOnly ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("intake")} /> : null}
      <JobContext job={job} />

      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      {!editableStatus ? <div className="mb-4"><Notice tone="success">งานออกจากขั้นรับงานแล้ว ข้อมูลหน้านี้จึงถูกล็อก</Notice></div> : null}

      <Panel>
        <fieldset className="contents" disabled={readOnly}>
          <FormSection description="ใช้ตรวจงานซ้ำและติดตามกำหนดส่งของธนาคาร" title="ข้อมูลงานจากธนาคาร">
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="intake-bank" label="ธนาคาร">
                <Select id="intake-bank" onChange={(event) => updateWorkflow("bank", event.target.value)} value={job.workflow.bank}>
                  <option value="">เลือกธนาคาร</option>
                  {bankOptions.map((bank) => <option key={bank}>{bank}</option>)}
                </Select>
              </Field>
              <Field htmlFor="intake-case" label="เลขอ้างอิงธนาคาร">
                <Input id="intake-case" onChange={(event) => updateWorkflow("caseId", event.target.value)} placeholder="เช่น BK-2026-0001" value={job.workflow.caseId} />
              </Field>
              <Field htmlFor="intake-received" label="วันที่รับงาน">
                <Input id="intake-received" onChange={(event) => setJob({ ...job, receivedAt: event.target.value })} type="date" value={job.receivedAt} />
              </Field>
              <Field htmlFor="intake-due" label="กำหนดส่ง">
                <Input id="intake-due" onChange={(event) => setJob({ ...job, dueDate: event.target.value })} type="date" value={job.dueDate} />
              </Field>
              <Field htmlFor="intake-client" label="ผู้ว่าจ้าง">
                <Input id="intake-client" onChange={(event) => updateWorkflow("clientName", event.target.value)} value={job.workflow.clientName} />
              </Field>
              <Field htmlFor="intake-type" label="ประเภททรัพย์เบื้องต้น">
                <Select id="intake-type" onChange={(event) => setJob({ ...job, property: { ...job.property, propertyType: event.target.value } })} value={job.property.propertyType}>
                  {propertyTypeOptions.map((type) => <option key={type}>{type}</option>)}
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field htmlFor="intake-address" label="ที่อยู่ทรัพย์เบื้องต้น">
                  <Textarea id="intake-address" onChange={(event) => setJob({ ...job, property: { ...job.property, address: event.target.value } })} value={job.property.address} />
                </Field>
              </div>
            </div>
          </FormSection>
          <div className="border-t border-line">
            <FormSection description="prototype ยังไม่มี directory บัญชีผู้ใช้ จึงระบุชื่อผู้ประเมินเป็นข้อความ" title="ผู้ติดต่อและการมอบหมาย">
              <div className="grid gap-4 md:grid-cols-2">
                <Field htmlFor="contact-name" label="ผู้ติดต่อเข้าพื้นที่">
                  <Input id="contact-name" onChange={(event) => updateWorkflow("siteContactName", event.target.value)} value={job.workflow.siteContactName} />
                </Field>
                <Field htmlFor="contact-phone" label="เบอร์ติดต่อ">
                  <Input id="contact-phone" inputMode="tel" onChange={(event) => updateWorkflow("siteContactPhone", event.target.value)} value={job.workflow.siteContactPhone} />
                </Field>
                <Field htmlFor="assignee" label="ผู้ประเมินทีม B">
                  <Input id="assignee" onChange={(event) => setJob({ ...job, assignee: event.target.value })} placeholder="เช่น ผู้ประเมิน 01" value={job.assignee} />
                </Field>
                <Field htmlFor="visit-date" label="วันลงพื้นที่">
                  <Input id="visit-date" onChange={(event) => updateWorkflow("visitDate", event.target.value)} type="date" value={job.workflow.visitDate} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={missing.length === 0 ? "success" : "warning"}>{missing.length === 0 ? "พร้อมมอบหมาย" : `ขาด ${missing.length} รายการ`}</Badge>
                {missing.length > 0 ? <span className="text-sm text-muted">{missing.join(" · ")}</span> : null}
              </div>
            </FormSection>
          </div>
        </fieldset>
      </Panel>
      <Toast message={toast} />
    </>
  );
}
