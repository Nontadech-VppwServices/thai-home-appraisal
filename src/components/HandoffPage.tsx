"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { type BankSubmission, type SubmissionChannel } from "@/domain/appraisal";
import { recordBankSubmission } from "@/infrastructure/storage/appraisalStore";
import { JobContext, MissingJob, useStoredJob } from "./JobContext";
import { useAccess } from "./useAccess";
import {
  AccessBanner,
  Badge,
  Button,
  Field,
  Input,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHead,
  Select,
  Textarea,
  Toast,
} from "./ui";

const channelLabels: Record<SubmissionChannel, string> = {
  email: "อีเมล",
  bankPortal: "Bank Portal",
  api: "API (จำลอง)",
  other: "ช่องทางอื่น",
};

export function HandoffPage({ jobId }: { jobId: string }) {
  const job = useStoredJob(jobId);
  const { permission, team } = useAccess();
  const level = permission("handoff");
  const [channel, setChannel] = useState<SubmissionChannel>("bankPortal");
  const [sentAt, setSentAt] = useState(() => localDateTimeValue(new Date()));
  const [sender, setSender] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  if (!job) return <MissingJob />;

  const editable = canEdit(level) && job.status === "readyToSubmit";

  function submit() {
    if (!team || !editable) return;
    try {
      const parsed = new Date(sentAt);
      if (Number.isNaN(parsed.getTime())) throw new Error("กรุณาระบุวันเวลาที่ส่ง");
      const submission: BankSubmission = {
        channel,
        sentAt: parsed.toISOString(),
        sender,
        bankReference,
        note,
        simulated: true,
      };
      recordBankSubmission(job!.id, submission, team);
      setError("");
      setToast("บันทึกการส่งธนาคารในโหมด demo แล้ว");
      window.setTimeout(() => setToast(""), 2600);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "บันทึกการส่งไม่สำเร็จ");
    }
  }

  return (
    <>
      <PageHeader
        description="บันทึกหลักฐานการนำผลประเมินส่งกลับธนาคาร ขั้นตอนนี้เป็นการจำลองในเบราว์เซอร์เท่านั้น"
        eyebrow="ทีม C · ส่งมอบ"
        title="บันทึกการส่งผลกลับธนาคาร"
      />
      {!canEdit(level) ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("handoff")} /> : null}
      <JobContext job={job} />

      {job.submission ? (
        <Panel>
          <PanelHead aside={<Badge tone="success"><CheckCircle2 size={14} />บันทึกแล้ว</Badge>} title="หลักฐานการส่งในโหมด demo" />
          <PanelBody className="grid gap-5">
            <Notice tone="success">งานถูกปิดและล็อกการแก้ไขแล้ว แต่ไม่มีข้อมูลใดถูกส่งออกจากเบราว์เซอร์เครื่องนี้</Notice>
            <dl className="grid gap-4 md:grid-cols-2">
              <Meta label="ช่องทาง" value={channelLabels[job.submission.channel]} />
              <Meta label="วันเวลาที่ส่ง" value={formatDateTime(job.submission.sentAt)} />
              <Meta label="ผู้ส่ง" value={job.submission.sender} />
              <Meta label="เลขตอบกลับธนาคาร" value={job.submission.bankReference || "ยังไม่ระบุ"} />
              <div className="md:col-span-2"><Meta label="หมายเหตุ" value={job.submission.note || "ไม่มีหมายเหตุ"} /></div>
            </dl>
          </PanelBody>
        </Panel>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel>
            <PanelHead aside={<Badge tone="warning">Demo เท่านั้น</Badge>} title="รายละเอียดการส่ง" />
            <PanelBody>
              <fieldset className="grid gap-4 md:grid-cols-2" disabled={!editable}>
                <Field htmlFor="handoff-channel" label="ช่องทางที่ส่ง">
                  <Select id="handoff-channel" onChange={(event) => setChannel(event.target.value as SubmissionChannel)} value={channel}>
                    {Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                </Field>
                <Field htmlFor="handoff-time" label="วันเวลาที่ส่ง">
                  <Input id="handoff-time" onChange={(event) => setSentAt(event.target.value)} type="datetime-local" value={sentAt} />
                </Field>
                <Field htmlFor="handoff-sender" label="ชื่อผู้ส่ง">
                  <Input id="handoff-sender" onChange={(event) => setSender(event.target.value)} placeholder="ชื่อเจ้าหน้าที่ทีม C" value={sender} />
                </Field>
                <Field htmlFor="handoff-reference" label="เลขอ้างอิงตอบกลับ">
                  <Input id="handoff-reference" onChange={(event) => setBankReference(event.target.value)} placeholder="ถ้ามี" value={bankReference} />
                </Field>
                <div className="md:col-span-2">
                  <Field htmlFor="handoff-note" label="หมายเหตุ">
                    <Textarea id="handoff-note" onChange={(event) => setNote(event.target.value)} value={note} />
                  </Field>
                </div>
              </fieldset>
              {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
            </PanelBody>
          </Panel>

          <aside className="grid gap-4">
            <Notice>{job.status === "readyToSubmit" ? "เมื่อยืนยัน งานจะเปลี่ยนเป็นส่งธนาคารแล้วและล็อกการแก้ไข" : "ต้องให้งานอยู่ในสถานะรอส่งธนาคารก่อน"}</Notice>
            <Button className="w-full" disabled={!editable || !sender.trim() || !sentAt} onClick={submit} variant="primary"><Send size={15} />ยืนยันการส่ง (Demo)</Button>
          </aside>
        </div>
      )}
      <Toast message={toast} />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold break-hard whitespace-pre-wrap">{value}</dd></div>;
}

function localDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(date);
}
