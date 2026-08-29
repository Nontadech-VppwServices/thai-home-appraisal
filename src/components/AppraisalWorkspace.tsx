"use client";

import { CheckCircle2, Circle, Printer, Save, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  bankOptions,
  calculateValuation,
  checklistItems,
  conditionOptions,
  formatMoney,
  formatNumber,
  propertyTypeOptions,
  statusLabels,
  submissionReadiness,
  type AppraisalJob,
  type ValuationMethod,
} from "@/domain/appraisal";
import { sourceLabels, summarizePriceReferences, unitLabels, type PriceReferenceSnapshot } from "@/domain/priceReferences";
import { canEdit, canView, ownerTeamLabel, type MenuKey } from "@/domain/access";
import { getJob, getSelectedPriceReferences, removeJob, saveJob, subscribeToJobs, transitionStoredJob } from "@/infrastructure/storage/appraisalStore";
import {
  AccessBanner,
  Badge,
  Button,
  EmptyState,
  Field,
  FormSection,
  Input,
  LinkButton,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHead,
  PhotoTile,
  PhotoUploader,
  PriceSummary,
  Select,
  StatCard,
  Stepper,
  Textarea,
  Toast,
} from "./ui";
import { useAccess } from "./useAccess";
import { JobContext } from "./JobContext";

type Section = "workflow" | "property" | "photos" | "valuation";

const MAX_PHOTOS = 12;

const steps: { section: Section | "references" | "report"; label: string }[] = [
  { section: "workflow", label: "ข้อมูลงาน" },
  { section: "property", label: "ทรัพย์สิน" },
  { section: "photos", label: "รูปถ่าย" },
  { section: "references", label: "ข้อมูลอ้างอิง" },
  { section: "valuation", label: "ประเมินราคา" },
  { section: "report", label: "รายงาน" },
];

export function AppraisalWorkspace({ jobId, section }: { jobId: string; section: Section }) {
  const router = useRouter();
  const { permission, team } = useAccess();
  const level = permission(section as MenuKey);
  const permissionReadOnly = !canEdit(level);
  const storedJob = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
  const [job, setJob] = useState<AppraisalJob | null>(storedJob);
  const editableStatus = job?.status === "assigned" || job?.status === "changesRequested";
  const readOnly = permissionReadOnly || !editableStatus;
  const [saveState, setSaveState] = useState("พร้อมแก้ไข");
  const [toast, setToast] = useState("");
  const skipFirstSave = useRef(true);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!job || readOnly) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaveState("กำลังบันทึกอัตโนมัติ");
    const timer = window.setTimeout(() => {
      try {
        saveJob(job);
        setSaveState("บันทึกอัตโนมัติแล้ว");
      } catch {
        setSaveState("บันทึกไม่สำเร็จ");
        showToast("พื้นที่จัดเก็บในเบราว์เซอร์อาจไม่พอ โดยเฉพาะรูปภาพขนาดใหญ่");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [job, readOnly]);

  useEffect(() => {
    if (!storedJob || job) return;
    window.setTimeout(() => setJob(storedJob), 0);
  }, [job, storedJob]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }

  function handleSave() {
    if (!job) return;
    try {
      saveJob(job);
      setSaveState("บันทึกแล้ว");
      showToast("บันทึกงานไว้ในเครื่องแล้ว");
    } catch {
      setSaveState("บันทึกไม่สำเร็จ");
      showToast("บันทึกไม่สำเร็จ กรุณาลดจำนวนหรือขนาดรูปภาพ");
    }
  }

  function startNewJob() {
    if (!window.confirm("เริ่มงานใหม่และล้างงานนี้ออกจากเบราว์เซอร์หรือไม่")) return;
    removeJob(jobId);
    router.push("/jobs/new");
  }

  function sendForReview() {
    if (!job || !team || readOnly) return;
    const readiness = submissionReadiness(job);
    if (!readiness.ready) {
      showToast("กรุณากรอกข้อมูลทรัพย์ รูปหลักฐาน และราคาให้ครบก่อนส่งตรวจ");
      return;
    }
    try {
      saveJob(job);
      const next = transitionStoredJob(job.id, "readyToSubmit", team, "ข้อมูลพร้อม ส่งให้ทีม C ตรวจสอบ");
      setJob(next);
      showToast("ส่งงานให้ทีม C ตรวจสอบแล้ว");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "ส่งงานไม่สำเร็จ");
    }
  }

  if (!job) {
    return (
      <EmptyState
        action={
          <LinkButton href="/jobs/new" variant="primary">
            สร้างงานใหม่
          </LinkButton>
        }
        description="งานอาจถูกล้างจากเบราว์เซอร์เครื่องนี้แล้ว"
        title="ไม่พบงานประเมินนี้"
      />
    );
  }

  const valuation = calculateValuation(job.property, job.valuation);
  const selectedReferenceSnapshots = getSelectedPriceReferences(job);
  const readiness = submissionReadiness(job);

  return (
    <>
      <PageHeader
        actions={
          readOnly ? (
            <LinkButton className="w-full sm:w-auto" href={`/jobs/${job.id}/report`}>
              <Printer size={15} />
              พิมพ์รายงาน
            </LinkButton>
          ) : (
            <>
              <Button className="w-full sm:w-auto" onClick={handleSave} variant="primary">
                <Save size={15} />
                บันทึกงาน
              </Button>
              {/* บนมือถือวางสองปุ่มรองคู่กันเพื่อไม่ให้ header ยาวเกินไป */}
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <LinkButton href={`/jobs/${job.id}/report`}>
                  <Printer size={15} />
                  พิมพ์รายงาน
                </LinkButton>
                <Button onClick={startNewJob} variant="ghost">
                  <Trash2 size={15} />
                  เริ่มงานใหม่
                </Button>
              </div>
            </>
          )
        }
        description={pageIntro(section)}
        eyebrow={job.workflow.caseId || "งานแบบร่าง"}
        title={pageTitle(section)}
      />

      {permissionReadOnly ? (
        <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel(section as MenuKey)} />
      ) : null}

      {!permissionReadOnly && !editableStatus ? (
        <div className="mb-6"><Notice tone={job.status === "submitted" ? "success" : "warning"}>งานอยู่ในสถานะ {statusLabels[job.status]} จึงล็อกการแก้ไขในหน้าประเมิน</Notice></div>
      ) : null}

      <JobContext job={job} />

      <Stepper
        currentIndex={steps.findIndex((step) => step.section === section)}
        steps={steps.map((step) => ({ href: `/jobs/${job.id}/${step.section}`, label: step.label }))}
      />

      <section aria-label="สรุปงาน" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="สถานะงาน" value={statusLabels[job.status]} />
        <StatCard label="รูปหลักฐาน" unit="รูป" value={String(job.photos.length)} />
        <StatCard label="พื้นที่ใช้สอย" unit="ตร.ม." value={formatNumber(job.property.usableArea)} />
        <StatCard
          highlight
          label="ราคาประเมิน"
          value={valuation.price > 0 ? `${formatNumber(valuation.price)} ฿` : "ยังไม่ระบุ"}
        />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Panel>
          <PanelHead
            aside={
              readOnly ? (
                <Badge tone="neutral">อ่านอย่างเดียว</Badge>
              ) : (
                <Badge tone={saveState === "บันทึกไม่สำเร็จ" ? "danger" : "neutral"}>{saveState}</Badge>
              )
            }
            title={pageTitle(section)}
          />
          {/* fieldset disabled ปิดการแก้ทุก control ข้างในให้เอง ไม่ต้องไล่ใส่ทีละช่อง */}
          <fieldset className="contents" disabled={readOnly}>
            {section === "workflow" ? <WorkflowSection job={job} setJob={setJob} /> : null}
            {section === "property" ? <PropertySection job={job} setJob={setJob} /> : null}
            {section === "photos" ? <PhotosSection job={job} setJob={setJob} showToast={showToast} /> : null}
            {section === "valuation" ? <ValuationSection job={job} setJob={setJob} /> : null}
          </fieldset>
        </Panel>

        <aside className="grid gap-4 xl:sticky xl:top-6">
          <PriceSummary
            basis={valuation.price > 0 ? valuation.basis : "กรุณากรอกข้อมูลราคา"}
            price={formatMoney(valuation.price)}
          />

          <Panel>
            <PanelBody className="grid gap-4">
              <h3 className="text-base font-bold">ก่อนส่งให้ผู้ตรวจสอบ</h3>
              <fieldset className="grid gap-3" disabled={readOnly}>
                {checklistItems.map((item, index) => (
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft" key={item}>
                    <input
                      checked={job.checks[index] ?? false}
                      className="mt-0.5 size-4.5 shrink-0 accent-accent"
                      onChange={(event) => updateCheck(job, setJob, index, event.target.checked)}
                      type="checkbox"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </fieldset>
              <Notice>
                Prototype นี้บันทึกข้อมูลไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ยังไม่มีการส่งข้อมูลจริงไปธนาคาร
              </Notice>
              {job.selectedReferences.length === 0 ? (
                <Notice>
                  ยังไม่ได้เลือกข้อมูลอ้างอิงราคา ระบบจะแจ้งเตือนแต่ไม่บล็อกการส่งงาน
                  {canView(permission("references")) ? (
                    <span> — <Link className="font-bold underline underline-offset-2" href={`/jobs/${job.id}/references`}>ไปค้นข้อมูลอ้างอิง</Link></span>
                  ) : null}
                </Notice>
              ) : (
                <Notice tone="success">เลือกข้อมูลอ้างอิงแล้ว {selectedReferenceSnapshots.length} รายการ</Notice>
              )}
              <div className="grid gap-2 border-t border-line pt-4">
                {readiness.items.map((item) => (
                  <div className="flex items-center gap-2 text-xs font-semibold" key={item.key}>
                    {item.complete ? <CheckCircle2 className="text-success" size={15} /> : <Circle className="text-warning" size={15} />}
                    <span className={item.complete ? "text-ink-soft" : "text-muted"}>{item.label}</span>
                  </div>
                ))}
              </div>
              {editableStatus && canEdit(permission("valuation")) ? (
                <Button disabled={!readiness.ready} onClick={sendForReview} variant="primary"><Send size={15} />ส่งให้ทีม C ตรวจ</Button>
              ) : null}
            </PanelBody>
          </Panel>
        </aside>
      </div>

      <Toast message={toast} />
    </>
  );
}

function emptyJob(): AppraisalJob | null {
  return null;
}

function WorkflowSection({ job, setJob }: SectionProps) {
  return (
    <FormSection description="ข้อมูลที่ใช้ระบุงานในรายการและบนหัวรายงาน" title="ข้อมูลที่ใช้ระบุงาน">
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="wf-caseId" label="เลขที่งาน">
          <Input
            id="wf-caseId"
            onChange={(event) =>
              setJob({ ...job, workflow: { ...job.workflow, caseId: event.target.value } })
            }
            placeholder="เช่น APP-2026-0001"
            value={job.workflow.caseId}
          />
        </Field>
        <Field htmlFor="wf-visitDate" label="วันที่ลงพื้นที่">
          <Input
            id="wf-visitDate"
            onChange={(event) =>
              setJob({ ...job, workflow: { ...job.workflow, visitDate: event.target.value } })
            }
            type="date"
            value={job.workflow.visitDate}
          />
        </Field>
        <Field htmlFor="wf-clientName" label="ชื่อผู้ว่าจ้าง">
          <Input
            id="wf-clientName"
            onChange={(event) =>
              setJob({ ...job, workflow: { ...job.workflow, clientName: event.target.value } })
            }
            placeholder="ชื่อบุคคลหรือองค์กร"
            value={job.workflow.clientName}
          />
        </Field>
        <Field htmlFor="wf-bank" label="ธนาคารปลายทาง">
          <Select
            id="wf-bank"
            onChange={(event) =>
              setJob({ ...job, workflow: { ...job.workflow, bank: event.target.value } })
            }
            value={job.workflow.bank}
          >
            <option value="">เลือกธนาคาร</option>
            {bankOptions.map((bank) => (
              <option key={bank}>{bank}</option>
            ))}
          </Select>
        </Field>
      </div>
    </FormSection>
  );
}

function PropertySection({ job, setJob }: SectionProps) {
  return (
    <FormSection description="ที่ตั้ง ลักษณะบ้าน และพื้นที่ที่ใช้อ้างอิงในรายงานประเมิน" title="ข้อมูลบ้านและที่ตั้ง">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field htmlFor="pr-address" label="ที่อยู่ทรัพย์สิน">
            <Textarea
              id="pr-address"
              onChange={(event) => updateProperty(job, setJob, "address", event.target.value)}
              placeholder="บ้านเลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
              value={job.property.address}
            />
          </Field>
        </div>

        <Field htmlFor="pr-lat" label="ละติจูด">
          <Input
            id="pr-lat"
            onChange={(event) => updateProperty(job, setJob, "latitude", event.target.value)}
            placeholder="เช่น 13.7563"
            value={job.property.latitude}
          />
        </Field>
        <Field htmlFor="pr-lng" label="ลองจิจูด">
          <Input
            id="pr-lng"
            onChange={(event) => updateProperty(job, setJob, "longitude", event.target.value)}
            placeholder="เช่น 100.5018"
            value={job.property.longitude}
          />
        </Field>
        <Field htmlFor="pr-type" label="ประเภททรัพย์">
          <Select
            id="pr-type"
            onChange={(event) => updateProperty(job, setJob, "propertyType", event.target.value)}
            value={job.property.propertyType}
          >
            {propertyTypeOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="pr-condition" label="สภาพบ้าน">
          <Select
            id="pr-condition"
            onChange={(event) => updateProperty(job, setJob, "condition", event.target.value)}
            value={job.property.condition}
          >
            {conditionOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field help="ตร.วา" htmlFor="pr-landArea" label="เนื้อที่ดิน">
          <Input
            id="pr-landArea"
            min="0"
            onChange={(event) => updateProperty(job, setJob, "landArea", numberValue(event))}
            step="0.01"
            type="number"
            value={fieldValue(job.property.landArea)}
          />
        </Field>
        <Field help="ตร.ม." htmlFor="pr-usableArea" label="พื้นที่ใช้สอย">
          <Input
            id="pr-usableArea"
            min="0"
            onChange={(event) => updateProperty(job, setJob, "usableArea", numberValue(event))}
            step="0.01"
            type="number"
            value={fieldValue(job.property.usableArea)}
          />
        </Field>
        <Field htmlFor="pr-floors" label="จำนวนชั้น">
          <Input
            id="pr-floors"
            min="1"
            onChange={(event) => updateProperty(job, setJob, "floors", numberValue(event))}
            step="1"
            type="number"
            value={fieldValue(job.property.floors)}
          />
        </Field>
        <Field htmlFor="pr-buildYear" label="ปีที่สร้าง">
          <Input
            id="pr-buildYear"
            max="2600"
            min="1800"
            onChange={(event) => updateProperty(job, setJob, "buildYear", numberValue(event))}
            placeholder="พ.ศ."
            type="number"
            value={fieldValue(job.property.buildYear)}
          />
        </Field>
        <Field htmlFor="pr-bedrooms" label="จำนวนห้องนอน">
          <Input
            id="pr-bedrooms"
            min="0"
            onChange={(event) => updateProperty(job, setJob, "bedrooms", numberValue(event))}
            step="1"
            type="number"
            value={fieldValue(job.property.bedrooms)}
          />
        </Field>
        <Field htmlFor="pr-bathrooms" label="จำนวนห้องน้ำ">
          <Input
            id="pr-bathrooms"
            min="0"
            onChange={(event) => updateProperty(job, setJob, "bathrooms", numberValue(event))}
            step="1"
            type="number"
            value={fieldValue(job.property.bathrooms)}
          />
        </Field>

        <div className="md:col-span-2">
          <Field htmlFor="pr-description" label="รายละเอียดเพิ่มเติม">
            <Textarea
              id="pr-description"
              onChange={(event) => updateProperty(job, setJob, "description", event.target.value)}
              placeholder="วัสดุ สภาพแวดล้อม ทางเข้าออก สิ่งอำนวยความสะดวก หรือข้อสังเกต"
              value={job.property.description}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  );
}

function PhotosSection({ job, setJob, showToast }: SectionProps & { showToast: (message: string) => void }) {
  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const remaining = MAX_PHOTOS - job.photos.length;
    if (files.length > remaining) showToast(`เพิ่มรูปได้สูงสุด ${MAX_PHOTOS} รูปต่อหนึ่งงานใน prototype นี้`);

    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setJob((current) =>
          current
            ? {
                ...current,
                photos: [
                  ...current.photos,
                  { id: `${Date.now()}-${file.name}`, name: file.name, dataUrl: String(reader.result) },
                ],
              }
            : current,
        );
      });
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  return (
    <FormSection description="เพิ่มรูปจากอุปกรณ์ ดูตัวอย่าง และลบรูปที่ไม่ต้องการก่อนพิมพ์รายงาน" title="รูปถ่ายและหลักฐาน">
      <PhotoUploader count={job.photos.length} inputId="photoInput" max={MAX_PHOTOS} onAdd={addPhotos}>
        {job.photos.length === 0 ? (
          <EmptyState
            description="รูปภาพใน MVP นี้เก็บไว้ในเบราว์เซอร์เครื่องนี้ หากรูปมีขนาดใหญ่มากอาจเกินพื้นที่ localStorage"
            title="ยังไม่มีรูปหลักฐาน"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {job.photos.map((photo) => (
              <li key={photo.id}>
                <PhotoTile
                  name={photo.name}
                  onRemove={() =>
                    setJob({
                      ...job,
                      photos: job.photos.filter((item) => item.id !== photo.id),
                    })
                  }
                >
                  <Image
                    alt={photo.name}
                    className="size-full object-cover"
                    height={320}
                    src={photo.dataUrl}
                    unoptimized
                    width={320}
                  />
                </PhotoTile>
              </li>
            ))}
          </ul>
        )}
      </PhotoUploader>
    </FormSection>
  );
}

function ValuationSection({ job, setJob }: SectionProps) {
  const result = calculateValuation(job.property, job.valuation);
  const references = getSelectedPriceReferences(job);
  return (
    <FormSection description="เลือกวิธีประเมินและบันทึกที่มาของผลลัพธ์ให้ผู้ตรวจสอบเข้าใจได้" title="วิธีประเมินราคา">
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="va-method" label="วิธีประเมิน">
          <Select
            id="va-method"
            onChange={(event) => updateValuation(job, setJob, "method", event.target.value as ValuationMethod)}
            value={job.valuation.method}
          >
            <option value="manual">ผู้ประเมินกรอกเอง</option>
            <option value="area">พื้นที่ใช้สอยคูณราคาต่อตารางเมตร</option>
            <option value="compare">กรอกราคาจากทรัพย์เปรียบเทียบ</option>
          </Select>
        </Field>

        {job.valuation.method === "manual" ? (
          <Field help="บาท" htmlFor="va-manual" label="ราคาประเมิน">
            <Input
              id="va-manual"
              min="0"
              onChange={(event) => updateValuation(job, setJob, "manualPrice", numberValue(event))}
              step="1000"
              type="number"
              value={fieldValue(job.valuation.manualPrice)}
            />
          </Field>
        ) : null}
        {job.valuation.method === "area" ? (
          <Field help="บาท" htmlFor="va-rate" label="ราคาต่อตารางเมตร">
            <Input
              id="va-rate"
              min="0"
              onChange={(event) => updateValuation(job, setJob, "rate", numberValue(event))}
              step="100"
              type="number"
              value={fieldValue(job.valuation.rate)}
            />
          </Field>
        ) : null}
        {job.valuation.method === "compare" ? (
          <Field help="บาท" htmlFor="va-compare" label="ราคาจากทรัพย์เปรียบเทียบ">
            <Input
              id="va-compare"
              min="0"
              onChange={(event) => updateValuation(job, setJob, "comparePrice", numberValue(event))}
              step="1000"
              type="number"
              value={fieldValue(job.valuation.comparePrice)}
            />
          </Field>
        ) : null}
      </div>

      <Notice tone="success">
        ผลประเมิน: <strong className="tnum font-extrabold">{formatMoney(result.price)}</strong>
        {" · "}
        {result.price > 0 ? result.basis : "กรุณากรอกข้อมูลราคา"}
      </Notice>

      <ReferenceSummary jobId={job.id} references={references} />
    </FormSection>
  );
}

function ReferenceSummary({ jobId, references }: { jobId: string; references: PriceReferenceSnapshot[] }) {
  const summaries = summarizePriceReferences(references);
  if (references.length === 0) {
    return (
      <Notice>
        ยังไม่มีข้อมูลอ้างอิงที่เลือกไว้ ราคาในหน้านี้ยังกรอกได้ตามดุลยพินิจของผู้ประเมิน
      </Notice>
    );
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">ช่วงราคาจากข้อมูลที่เลือก</h3>
          <p className="text-sm text-muted">แยกตามแหล่งและหน่วย ระบบไม่นำคนละกลุ่มมาเฉลี่ยรวมกัน</p>
        </div>
        <LinkButton href={`/jobs/${jobId}/references`} size="sm">
          จัดการข้อมูลอ้างอิง
        </LinkButton>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {summaries.map((summary) => (
          <div className="rounded-control border border-line bg-surface-2 p-4" key={`${summary.sourceCategory}-${summary.unit}`}>
            <div className="text-xs font-bold text-muted">{sourceLabels[summary.sourceCategory]} · {unitLabels[summary.unit]}</div>
            <div className="tnum mt-2 text-sm font-semibold">
              {formatNumber(summary.minimum)} – <strong className="text-base font-extrabold">{formatNumber(summary.median)}</strong> – {formatNumber(summary.maximum)}
            </div>
            <div className="mt-1 text-xs text-muted">ต่ำสุด · ค่ากลาง · สูงสุด ({summary.count} รายการ)</div>
          </div>
        ))}
      </div>
    </section>
  );
}

type SectionProps = {
  job: AppraisalJob;
  setJob: React.Dispatch<React.SetStateAction<AppraisalJob | null>>;
};

function updateProperty<Key extends keyof AppraisalJob["property"]>(job: AppraisalJob, setJob: SectionProps["setJob"], key: Key, value: AppraisalJob["property"][Key]) {
  setJob({ ...job, property: { ...job.property, [key]: value } });
}

function updateValuation<Key extends keyof AppraisalJob["valuation"]>(job: AppraisalJob, setJob: SectionProps["setJob"], key: Key, value: AppraisalJob["valuation"][Key]) {
  setJob({ ...job, valuation: { ...job.valuation, [key]: value } });
}

function updateCheck(job: AppraisalJob, setJob: SectionProps["setJob"], index: number, checked: boolean) {
  const checks = [...job.checks];
  checks[index] = checked;
  setJob({ ...job, checks });
}

function numberValue(event: ChangeEvent<HTMLInputElement>): number {
  return Number(event.target.value);
}

function fieldValue(value: number): string | number {
  return value === 0 ? "" : value;
}

function pageTitle(section: Section): string {
  return {
    workflow: "ข้อมูลงาน",
    property: "ข้อมูลทรัพย์สิน",
    photos: "รูปถ่ายหลักฐาน",
    valuation: "ประเมินราคา",
  }[section];
}

function pageIntro(section: Section): string {
  return {
    workflow: "แก้ไขเลขที่งาน วันที่ ผู้ว่าจ้าง และธนาคารปลายทางได้ตลอดเวลาที่ยังเป็นแบบร่าง",
    property: "บันทึกที่อยู่ พิกัด ลักษณะบ้าน พื้นที่ และรายละเอียดที่จำเป็นต่อรายงานประเมิน",
    photos: "เพิ่มรูปหลายรูปจากอุปกรณ์ ดูตัวอย่าง และลบรูปที่ไม่ต้องการก่อนพิมพ์รายงาน",
    valuation: "เลือกวิธีประเมินราคาและบันทึกคำอธิบายที่มาของผลลัพธ์ให้ผู้ตรวจสอบเข้าใจได้",
  }[section];
}
