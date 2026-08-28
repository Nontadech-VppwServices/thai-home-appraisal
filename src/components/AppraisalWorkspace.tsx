"use client";

import { Printer, Save, Trash2 } from "lucide-react";
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
  type AppraisalJob,
  type ValuationMethod,
} from "@/domain/appraisal";
import { getJob, removeJob, saveDraft, saveJob, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { Badge, Button, Field, FormSection, Toast } from "./ui";

type Section = "workflow" | "property" | "photos" | "valuation";

const steps: { section: Section | "report"; label: string }[] = [
  { section: "workflow", label: "ข้อมูลงาน" },
  { section: "property", label: "ทรัพย์สิน" },
  { section: "photos", label: "รูปถ่าย" },
  { section: "valuation", label: "ประเมินราคา" },
  { section: "report", label: "รายงาน" },
];

export function AppraisalWorkspace({ jobId, section }: { jobId: string; section: Section }) {
  const router = useRouter();
  const storedJob = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
  const [job, setJob] = useState<AppraisalJob | null>(storedJob);
  const [saveState, setSaveState] = useState("พร้อมแก้ไข");
  const [toast, setToast] = useState("");
  const skipFirstSave = useRef(true);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!job) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaveState("กำลังบันทึกอัตโนมัติ");
    const timer = window.setTimeout(() => {
      try {
        saveDraft({ ...job, status: "draft" });
        setSaveState("บันทึกอัตโนมัติแล้ว");
      } catch {
        setSaveState("บันทึกไม่สำเร็จ");
        showToast("พื้นที่จัดเก็บในเบราว์เซอร์อาจไม่พอ โดยเฉพาะรูปภาพขนาดใหญ่");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [job]);

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
      setJob({ ...job, status: "saved" });
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

  if (!job) {
    return (
      <section className="empty-state">
        <div>
          <h1>ไม่พบงานประเมินนี้</h1>
          <p className="intro">งานอาจถูกล้างจากเบราว์เซอร์เครื่องนี้แล้ว</p>
          <div className="action-row action-center">
            <Link className="btn btn-primary" href="/jobs/new">สร้างงานใหม่</Link>
          </div>
        </div>
      </section>
    );
  }

  const valuation = calculateValuation(job.property, job.valuation);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">{job.workflow.caseId || "Home appraisal / draft"}</div>
          <h1>{pageTitle(section)}</h1>
          <p className="intro">{pageIntro(section)}</p>
        </div>
        <div className="actions no-print">
          <Button onClick={startNewJob}><Trash2 size={15} />เริ่มงานใหม่</Button>
          <Link className="btn btn-primary" href={`/jobs/${job.id}/report`}><Printer size={15} />พิมพ์รายงาน</Link>
          <Button onClick={handleSave} variant="dark"><Save size={15} />บันทึกงาน</Button>
        </div>
      </header>

      <nav className="step-strip no-print" aria-label="ขั้นตอนงานประเมิน">
        {steps.map((step) => (
          <Link className={step.section === section ? "active" : ""} href={`/jobs/${job.id}/${step.section}`} key={step.section}>
            {step.label}
          </Link>
        ))}
      </nav>

      <section className="stats" aria-label="สรุปงาน">
        <div className="panel stat"><div className="stat-label">สถานะงาน</div><div className="stat-value">{job.status === "saved" ? "บันทึกแล้ว" : "แบบร่าง"}</div></div>
        <div className="panel stat"><div className="stat-label">รูปหลักฐาน</div><div className="stat-value">{job.photos.length} <small>รูป</small></div></div>
        <div className="panel stat"><div className="stat-label">พื้นที่ใช้สอย</div><div className="stat-value">{formatNumber(job.property.usableArea)} <small>ตร.ม.</small></div></div>
        <div className="panel stat"><div className="stat-label">ราคาประเมิน</div><div className="stat-value">{valuation.price > 0 ? `${formatNumber(valuation.price)} ฿` : "ยังไม่ระบุ"}</div></div>
      </section>

      <div className="workspace">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="section-title">แบบฟอร์มงานประเมิน</div>
              <h2>{pageTitle(section)}</h2>
            </div>
            <Badge tone={job.status === "saved" ? "success" : "neutral"}>{saveState}</Badge>
          </div>
          {section === "workflow" ? <WorkflowSection job={job} setJob={setJob} /> : null}
          {section === "property" ? <PropertySection job={job} setJob={setJob} /> : null}
          {section === "photos" ? <PhotosSection job={job} setJob={setJob} showToast={showToast} /> : null}
          {section === "valuation" ? <ValuationSection job={job} setJob={setJob} /> : null}
        </section>

        <aside className="sticky-side">
          <section className="panel price-panel">
            <div className="panel-body">
              <div className="section-title">REQ-VALUATION-002</div>
              <h2>สรุปราคา</h2>
              <p className="intro">แสดงผลและที่มาของราคาจากวิธีประเมินที่เลือก</p>
              <div className="price">{formatMoney(valuation.price)}</div>
              <div className="price-sub">{valuation.price > 0 ? valuation.basis : "กรุณากรอกข้อมูลราคา"}</div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-body checklist">
              <h3>ก่อนส่งให้ผู้ตรวจสอบ</h3>
              {checklistItems.map((item, index) => (
                <label className="check" key={item}>
                  <input checked={job.checks[index] ?? false} type="checkbox" onChange={(event) => updateCheck(job, setJob, index, event.target.checked)} />
                  <span>{item}</span>
                </label>
              ))}
              <div className="notice">Prototype นี้บันทึกข้อมูลไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ยังไม่มีการส่งข้อมูลจริงไปธนาคาร</div>
            </div>
          </section>
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
    <FormSection eyebrow="REQ-WORKFLOW-001 / REQ-WORKFLOW-002" title="ข้อมูลที่ใช้ระบุงาน">
      <div className="grid">
        <Field label="เลขที่งาน">
          <input value={job.workflow.caseId} onChange={(event) => setJob({ ...job, status: "draft", workflow: { ...job.workflow, caseId: event.target.value } })} placeholder="เช่น APP-2026-0001" />
        </Field>
        <Field label="วันที่ลงพื้นที่">
          <input type="date" value={job.workflow.visitDate} onChange={(event) => setJob({ ...job, status: "draft", workflow: { ...job.workflow, visitDate: event.target.value } })} />
        </Field>
        <Field label="ชื่อผู้ว่าจ้าง">
          <input value={job.workflow.clientName} onChange={(event) => setJob({ ...job, status: "draft", workflow: { ...job.workflow, clientName: event.target.value } })} placeholder="ชื่อบุคคลหรือองค์กร" />
        </Field>
        <Field label="ธนาคารปลายทาง">
          <select value={job.workflow.bank} onChange={(event) => setJob({ ...job, status: "draft", workflow: { ...job.workflow, bank: event.target.value } })}>
            <option value="">เลือกธนาคาร</option>
            {bankOptions.map((bank) => <option key={bank}>{bank}</option>)}
          </select>
        </Field>
      </div>
    </FormSection>
  );
}

function PropertySection({ job, setJob }: SectionProps) {
  return (
    <FormSection eyebrow="REQ-PROPERTY-001 / REQ-PROPERTY-002" title="ข้อมูลบ้านและที่ตั้ง">
      <div className="grid">
        <div className="full"><Field label="ที่อยู่ทรัพย์สิน">
          <textarea value={job.property.address} onChange={(event) => updateProperty(job, setJob, "address", event.target.value)} placeholder="บ้านเลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" />
        </Field></div>
        <Field label="ละติจูด"><input value={job.property.latitude} onChange={(event) => updateProperty(job, setJob, "latitude", event.target.value)} placeholder="เช่น 13.7563" /></Field>
        <Field label="ลองจิจูด"><input value={job.property.longitude} onChange={(event) => updateProperty(job, setJob, "longitude", event.target.value)} placeholder="เช่น 100.5018" /></Field>
        <Field label="ประเภททรัพย์"><select value={job.property.propertyType} onChange={(event) => updateProperty(job, setJob, "propertyType", event.target.value)}>{propertyTypeOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="สภาพบ้าน"><select value={job.property.condition} onChange={(event) => updateProperty(job, setJob, "condition", event.target.value)}>{conditionOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="เนื้อที่ดิน" help="ตร.วา"><input min="0" step="0.01" type="number" value={fieldValue(job.property.landArea)} onChange={(event) => updateProperty(job, setJob, "landArea", numberValue(event))} /></Field>
        <Field label="พื้นที่ใช้สอย" help="ตร.ม."><input min="0" step="0.01" type="number" value={fieldValue(job.property.usableArea)} onChange={(event) => updateProperty(job, setJob, "usableArea", numberValue(event))} /></Field>
        <Field label="จำนวนชั้น"><input min="1" step="1" type="number" value={fieldValue(job.property.floors)} onChange={(event) => updateProperty(job, setJob, "floors", numberValue(event))} /></Field>
        <Field label="ปีที่สร้าง"><input min="1800" max="2600" type="number" value={fieldValue(job.property.buildYear)} onChange={(event) => updateProperty(job, setJob, "buildYear", numberValue(event))} placeholder="พ.ศ." /></Field>
        <Field label="จำนวนห้องนอน"><input min="0" step="1" type="number" value={fieldValue(job.property.bedrooms)} onChange={(event) => updateProperty(job, setJob, "bedrooms", numberValue(event))} /></Field>
        <Field label="จำนวนห้องน้ำ"><input min="0" step="1" type="number" value={fieldValue(job.property.bathrooms)} onChange={(event) => updateProperty(job, setJob, "bathrooms", numberValue(event))} /></Field>
        <div className="full"><Field label="รายละเอียดเพิ่มเติม"><textarea value={job.property.description} onChange={(event) => updateProperty(job, setJob, "description", event.target.value)} placeholder="วัสดุ สภาพแวดล้อม ทางเข้าออก สิ่งอำนวยความสะดวก หรือข้อสังเกต" /></Field></div>
      </div>
    </FormSection>
  );
}

function PhotosSection({ job, setJob, showToast }: SectionProps & { showToast: (message: string) => void }) {
  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const remaining = 12 - job.photos.length;
    if (files.length > remaining) showToast("เพิ่มรูปได้สูงสุด 12 รูปต่อหนึ่งงานใน prototype นี้");

    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setJob((current) => current ? {
          ...current,
          status: "draft",
          photos: [...current.photos, { id: `${Date.now()}-${file.name}`, name: file.name, dataUrl: String(reader.result) }],
        } : current);
      });
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  return (
    <FormSection eyebrow="REQ-PHOTO-001 / REQ-PHOTO-002" title="รูปถ่ายและหลักฐาน">
      <label className="photo-drop" htmlFor="photoInput">
        <span><strong>แตะเพื่อเพิ่มรูปถ่าย</strong>รูปด้านหน้า บ้านเลขที่ ภายในบ้าน ถนน และสภาพแวดล้อม</span>
      </label>
      <input className="photo-input" id="photoInput" type="file" accept="image/*" multiple onChange={addPhotos} />
      <div className="notice mt-md">รูปภาพใน MVP นี้เก็บเป็นข้อมูลในเบราว์เซอร์เครื่องนี้ หากรูปมีขนาดใหญ่มากอาจเกินพื้นที่ localStorage</div>
      {job.photos.length === 0 ? <div className="empty-state mt-md">ยังไม่มีรูปหลักฐาน</div> : null}
      <div className="photos">
        {job.photos.map((photo) => (
          <div className="photo" key={photo.id}>
            <Image alt={photo.name} height={320} src={photo.dataUrl} unoptimized width={320} />
            <Button aria-label={`ลบ ${photo.name}`} onClick={() => setJob({ ...job, status: "draft", photos: job.photos.filter((item) => item.id !== photo.id) })} variant="danger"><Trash2 size={15} /></Button>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function ValuationSection({ job, setJob }: SectionProps) {
  const result = calculateValuation(job.property, job.valuation);
  return (
    <FormSection eyebrow="REQ-VALUATION-001 / REQ-VALUATION-002" title="วิธีประเมินราคา">
      <div className="grid">
        <Field label="วิธีประเมิน">
          <select value={job.valuation.method} onChange={(event) => updateValuation(job, setJob, "method", event.target.value as ValuationMethod)}>
            <option value="manual">ผู้ประเมินกรอกเอง</option>
            <option value="area">พื้นที่ใช้สอยคูณราคาต่อตารางเมตร</option>
            <option value="compare">กรอกราคาจากทรัพย์เปรียบเทียบ</option>
          </select>
        </Field>
        {job.valuation.method === "manual" ? <Field label="ราคาประเมิน" help="บาท"><input min="0" step="1000" type="number" value={fieldValue(job.valuation.manualPrice)} onChange={(event) => updateValuation(job, setJob, "manualPrice", numberValue(event))} /></Field> : null}
        {job.valuation.method === "area" ? <Field label="ราคาต่อตารางเมตร" help="บาท"><input min="0" step="100" type="number" value={fieldValue(job.valuation.rate)} onChange={(event) => updateValuation(job, setJob, "rate", numberValue(event))} /></Field> : null}
        {job.valuation.method === "compare" ? <Field label="ราคาจากทรัพย์เปรียบเทียบ" help="บาท"><input min="0" step="1000" type="number" value={fieldValue(job.valuation.comparePrice)} onChange={(event) => updateValuation(job, setJob, "comparePrice", numberValue(event))} /></Field> : null}
      </div>
      <div className="success-note mt-lg">ผลประเมิน: {formatMoney(result.price)} · {result.price > 0 ? result.basis : "กรุณากรอกข้อมูลราคา"}</div>
    </FormSection>
  );
}

type SectionProps = {
  job: AppraisalJob;
  setJob: React.Dispatch<React.SetStateAction<AppraisalJob | null>>;
};

function updateProperty<Key extends keyof AppraisalJob["property"]>(job: AppraisalJob, setJob: SectionProps["setJob"], key: Key, value: AppraisalJob["property"][Key]) {
  setJob({ ...job, status: "draft", property: { ...job.property, [key]: value } });
}

function updateValuation<Key extends keyof AppraisalJob["valuation"]>(job: AppraisalJob, setJob: SectionProps["setJob"], key: Key, value: AppraisalJob["valuation"][Key]) {
  setJob({ ...job, status: "draft", valuation: { ...job.valuation, [key]: value } });
}

function updateCheck(job: AppraisalJob, setJob: SectionProps["setJob"], index: number, checked: boolean) {
  const checks = [...job.checks];
  checks[index] = checked;
  setJob({ ...job, status: "draft", checks });
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
