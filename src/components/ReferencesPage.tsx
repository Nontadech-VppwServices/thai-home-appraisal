"use client";

import { ExternalLink, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { externalSearchLinks } from "@/application/priceReferences";
import { canEdit, canView, ownerTeamLabel } from "@/domain/access";
import { formatMoney, formatNumber, propertyTypeOptions, statusLabels, type AppraisalJob } from "@/domain/appraisal";
import {
  searchPriceReferences,
  sourceLabels,
  summarizePriceReferences,
  unitLabels,
  type PriceReferenceSnapshot,
  type PriceReferenceSource,
  type PriceReferenceUnit,
  type ReferenceSearchCriteria,
} from "@/domain/priceReferences";
import {
  captureAndSelectPriceReference,
  getJob,
  getSelectedPriceReferences,
  listInternalJobReferences,
  listPriceReferences,
  subscribeToJobs,
  unselectPriceReference,
  updateSelectedReferenceNote,
} from "@/infrastructure/storage/appraisalStore";
import {
  AccessBanner,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  LinkButton,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHead,
  Select,
  StatCard,
  Stepper,
  Textarea,
  Toast,
} from "./ui";
import { useAccess } from "./useAccess";
import { JobContext } from "./JobContext";

const tabs: { value: PriceReferenceSource; label: string }[] = [
  { value: "official", label: "ราคาภาครัฐ" },
  { value: "market", label: "ราคาประกาศตลาด" },
  { value: "internal", label: "งานเดิมบริษัท" },
];

const steps = [
  { section: "workflow", label: "ข้อมูลงาน" },
  { section: "property", label: "ทรัพย์สิน" },
  { section: "photos", label: "รูปถ่าย" },
  { section: "references", label: "ข้อมูลอ้างอิง" },
  { section: "valuation", label: "ประเมินราคา" },
  { section: "report", label: "รายงาน" },
];

type ActiveSearchCriteria = Omit<ReferenceSearchCriteria, "sourceCategory"> & {
  sourceCategory: PriceReferenceSource;
};

export function ReferencesPage({ jobId }: { jobId: string }) {
  const { permission, team } = useAccess();
  const level = permission("references");
  const job = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);
  const permissionReadOnly = !canEdit(level);
  const editableStatus = job?.status === "assigned" || job?.status === "changesRequested";
  const readOnly = permissionReadOnly || !editableStatus;
  const [criteria, setCriteria] = useState<ActiveSearchCriteria>({
    latitude: "",
    longitude: "",
    radiusKm: 5,
    maxAgeMonths: 24,
    propertyType: "บ้านเดี่ยว",
    sourceCategory: "official",
  });
  const initializedForJob = useRef("");
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!job || initializedForJob.current === job.id) return;
    initializedForJob.current = job.id;
    setCriteria((current) => ({
      ...current,
      latitude: job.property.latitude,
      longitude: job.property.longitude,
      propertyType: job.property.propertyType,
    }));
  }, [job]);

  function showToastMessage(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }

  if (!job) {
    return (
      <EmptyState
        action={<LinkButton href="/jobs/new" variant="primary">สร้างงานใหม่</LinkButton>}
        description="งานอาจถูกล้างจากเบราว์เซอร์เครื่องนี้แล้ว"
        title="ไม่พบงานประเมินนี้"
      />
    );
  }

  const allReferences = dedupeById([...listPriceReferences(), ...listInternalJobReferences(job.id)]);
  const activeJobId = job.id;
  const results = searchPriceReferences(allReferences, criteria, new Date().toISOString());
  const selectedSnapshots = getSelectedPriceReferences(job);
  const selectedIds = new Set(job.selectedReferences.map((item) => item.referenceId));
  const summaries = summarizePriceReferences(selectedSnapshots);
  const hasCoordinates = validCoordinates(criteria.latitude, criteria.longitude);

  function selectReference(reference: PriceReferenceSnapshot) {
    try {
      captureAndSelectPriceReference(activeJobId, reference, team ?? "admin");
      showToastMessage("เลือกและเก็บ snapshot ไว้ในคลังแล้ว");
    } catch (error) {
      showToastMessage(error instanceof Error ? error.message : "บันทึกข้อมูลอ้างอิงไม่สำเร็จ");
    }
  }

  return (
    <>
      <PageHeader
        actions={<LinkButton href={`/jobs/${job.id}/valuation`} variant="primary">ไปประเมินราคา</LinkButton>}
        description="ค้นข้อมูลใกล้เคียง เลือกหลักฐาน และเก็บค่าที่เห็น ณ วันนำเข้าเพื่อใช้อ้างอิงซ้ำ"
        eyebrow={job.workflow.caseId || "งานประเมิน"}
        title="ข้อมูลอ้างอิงราคา"
      />

      {permissionReadOnly ? <AccessBanner level={canView(level) ? "read" : "none"} ownerLabel={ownerTeamLabel("references")} /> : null}
      {!permissionReadOnly && !editableStatus ? <div className="mb-6"><Notice tone={job.status === "submitted" ? "success" : "warning"}>งานอยู่ในสถานะ {statusLabels[job.status]} จึงล็อกการแก้ข้อมูลอ้างอิง</Notice></div> : null}

      <JobContext job={job} />

      <Stepper
        currentIndex={3}
        steps={steps.map((step) => ({ href: `/jobs/${job.id}/${step.section}`, label: step.label }))}
      />

      <section aria-label="สรุปข้อมูลอ้างอิง" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="สถานะงาน" value={statusLabels[job.status]} />
        <StatCard label="ข้อมูลที่เลือก" unit="รายการ" value={String(selectedSnapshots.length)} />
        <StatCard label="รัศมีค้นหา" unit="กม." value={formatNumber(criteria.radiusKm)} />
        <StatCard highlight label="ผลที่พบ" unit="รายการ" value={String(results.length)} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="grid gap-6">
          <Panel>
            <PanelHead
              aside={<Badge tone="accent">ค่าเริ่มต้น 5 กม. / 24 เดือน</Badge>}
              description="ใช้พิกัดและประเภททรัพย์จากใบงานเป็นค่าเริ่มต้น"
              title="ค้นหาทรัพย์ใกล้เคียง"
            />
            <PanelBody className="grid gap-5">
              <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" disabled={readOnly}>
                <Field htmlFor="ref-lat" label="ละติจูด">
                  <Input id="ref-lat" onChange={(event) => setCriteria({ ...criteria, latitude: event.target.value })} value={criteria.latitude} />
                </Field>
                <Field htmlFor="ref-lng" label="ลองจิจูด">
                  <Input id="ref-lng" onChange={(event) => setCriteria({ ...criteria, longitude: event.target.value })} value={criteria.longitude} />
                </Field>
                <Field help="กม." htmlFor="ref-radius" label="รัศมี">
                  <Input id="ref-radius" min="0.1" onChange={(event) => setCriteria({ ...criteria, radiusKm: Number(event.target.value) })} step="0.5" type="number" value={criteria.radiusKm} />
                </Field>
                <Field help="เดือน" htmlFor="ref-age" label="ย้อนหลัง">
                  <Input id="ref-age" min="1" onChange={(event) => setCriteria({ ...criteria, maxAgeMonths: Number(event.target.value) })} step="1" type="number" value={criteria.maxAgeMonths} />
                </Field>
                <div className="md:col-span-2 xl:col-span-4">
                  <Field htmlFor="ref-type" label="ประเภททรัพย์">
                    <Select id="ref-type" onChange={(event) => setCriteria({ ...criteria, propertyType: event.target.value })} value={criteria.propertyType}>
                      {propertyTypeOptions.map((propertyType) => <option key={propertyType}>{propertyType}</option>)}
                    </Select>
                  </Field>
                </div>
              </fieldset>

              {!hasCoordinates ? (
                <Notice>กรอกพิกัดให้ถูกต้องก่อนค้นตามรัศมี หรือกลับไปบันทึกพิกัดในหน้าข้อมูลทรัพย์สิน</Notice>
              ) : null}

              <div aria-label="ประเภทแหล่งข้อมูล" className="grid grid-cols-3 gap-1 rounded-control bg-surface-2 p-1" role="tablist">
                {tabs.map((tab) => (
                  <button
                    aria-selected={criteria.sourceCategory === tab.value}
                    className={criteria.sourceCategory === tab.value ? "min-h-10 rounded-[7px] bg-accent px-2 text-xs font-bold text-white dark:text-canvas" : "min-h-10 rounded-[7px] px-2 text-xs font-bold text-muted hover:text-ink"}
                    key={tab.value}
                    onClick={() => setCriteria({ ...criteria, sourceCategory: tab.value })}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {criteria.sourceCategory === "official" || criteria.sourceCategory === "market" ? (
                <ExternalSearchLinks job={job} />
              ) : (
                <Notice>ผลจากงานเดิมมาจากเบราว์เซอร์เครื่องนี้เท่านั้น รุ่น production จึงจะค้นคลังกลางทั้งบริษัทได้</Notice>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              aside={!readOnly && (criteria.sourceCategory === "official" || criteria.sourceCategory === "market") ? (
                <Button onClick={() => setShowImport((current) => !current)} size="sm">
                  {showImport ? <X size={14} /> : <Plus size={14} />}
                  {showImport ? "ปิดฟอร์ม" : "บันทึกจากหน้าเว็บ"}
                </Button>
              ) : undefined}
              description="ไม่มีข้อมูลตัวอย่างปลอม ระบบแสดงเฉพาะข้อมูลที่เคยนำเข้าและงานจริงในเครื่อง"
              title={`ผลการค้นหา · ${sourceLabels[criteria.sourceCategory]}`}
            />
            {showImport && !readOnly && (criteria.sourceCategory === "official" || criteria.sourceCategory === "market") ? (
              <ImportReferenceForm
                category={criteria.sourceCategory}
                criteria={criteria}
                job={job}
                onCancel={() => setShowImport(false)}
                onImported={(snapshot) => {
                  selectReference(snapshot);
                  setShowImport(false);
                }}
                team={team ?? "admin"}
              />
            ) : null}
            <PanelBody>
              {results.length === 0 ? (
                <EmptyState
                  description={hasCoordinates ? "ลองขยายรัศมีหรือช่วงเวลา หรือเปิดแหล่งภายนอกแล้วนำข้อมูลที่ตรวจแล้วมาบันทึก" : "ระบบต้องมีพิกัดก่อนคำนวณระยะห่าง"}
                  title="ยังไม่พบข้อมูลที่ตรงเงื่อนไข"
                />
              ) : (
                <ul className="grid gap-3">
                  {results.map(({ reference, distanceKm }) => (
                    <li key={reference.id}>
                      <ReferenceCard
                        action={
                          <Button disabled={readOnly || selectedIds.has(reference.id)} onClick={() => selectReference(reference)} size="sm" variant={selectedIds.has(reference.id) ? "secondary" : "primary"}>
                            {selectedIds.has(reference.id) ? "เลือกแล้ว" : "เลือกข้อมูลนี้"}
                          </Button>
                        }
                        distanceKm={distanceKm}
                        reference={reference}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>
        </div>

        <aside className="grid gap-4 xl:sticky xl:top-6">
          <Panel>
            <PanelHead aside={<Badge tone={selectedSnapshots.length > 0 ? "success" : "warning"}>{selectedSnapshots.length} รายการ</Badge>} title="ข้อมูลที่เลือก" />
            <PanelBody className="grid gap-4">
              {selectedSnapshots.length === 0 ? (
                <Notice>ยังไม่ได้เลือกข้อมูล ระบบจะเตือนก่อนส่งงานแต่ไม่บล็อกการทำงาน</Notice>
              ) : (
                <ul className="grid gap-4">
                  {selectedSnapshots.map((reference) => {
                    const selection = job.selectedReferences.find((item) => item.referenceId === reference.id);
                    return (
                      <li className="grid gap-2 border-b border-line pb-4 last:border-0 last:pb-0" key={reference.id}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge tone={reference.sourceCategory === "market" ? "warning" : "neutral"}>{sourceLabels[reference.sourceCategory]}</Badge>
                            <div className="tnum mt-2 font-extrabold">{referencePriceLabel(reference)}</div>
                          </div>
                          {!readOnly ? <Button aria-label="ยกเลิกการเลือก" onClick={() => unselectPriceReference(job.id, reference.id)} size="sm" variant="ghost"><X size={15} /></Button> : null}
                        </div>
                        <p className="text-xs leading-relaxed text-muted">{reference.address || "ไม่ระบุที่อยู่"}</p>
                        <Field htmlFor={`note-${reference.id}`} label="หมายเหตุความเหมือน/ความต่าง">
                          <Textarea
                            defaultValue={selection?.adjustmentNote ?? ""}
                            disabled={readOnly}
                            id={`note-${reference.id}`}
                            onBlur={(event) => updateSelectedReferenceNote(job.id, reference.id, event.target.value)}
                            placeholder="เช่น ติดถนนใหญ่กว่า สภาพเก่ากว่า"
                          />
                        </Field>
                      </li>
                    );
                  })}
                </ul>
              )}
            </PanelBody>
          </Panel>

          {summaries.length > 0 ? (
            <Panel>
              <PanelHead title="ช่วงราคา" />
              <PanelBody className="grid gap-3">
                {summaries.map((summary) => (
                  <div className="rounded-control bg-surface-2 p-3" key={`${summary.sourceCategory}-${summary.unit}`}>
                    <div className="text-xs font-bold text-muted">{sourceLabels[summary.sourceCategory]} · {unitLabels[summary.unit]}</div>
                    <div className="tnum mt-1 text-sm font-semibold">{formatNumber(summary.minimum)} – <strong>{formatNumber(summary.median)}</strong> – {formatNumber(summary.maximum)}</div>
                    <div className="mt-1 text-xs text-muted">ต่ำสุด · ค่ากลาง · สูงสุด</div>
                  </div>
                ))}
              </PanelBody>
            </Panel>
          ) : null}
        </aside>
      </div>

      <Toast message={toast} />
    </>
  );
}

function ExternalSearchLinks({ job }: { job: AppraisalJob }) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {externalSearchLinks(job.property.propertyType, job.property.address).map((link) => (
        <a className="group rounded-control border border-line bg-surface p-3 transition-colors hover:border-action" href={link.href} key={link.href} rel="noreferrer" target="_blank">
          <span className="flex items-center gap-2 text-sm font-bold text-action">{link.label}<ExternalLink size={13} /></span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">{link.description}</span>
        </a>
      ))}
    </div>
  );
}

function ReferenceCard({ reference, distanceKm, action }: { reference: PriceReferenceSnapshot; distanceKm: number; action: React.ReactNode }) {
  return (
    <article className="grid gap-3 rounded-control border border-line bg-surface-2/50 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={reference.sourceCategory === "market" ? "warning" : reference.sourceCategory === "official" ? "action" : "accent"}>{sourceLabels[reference.sourceCategory]}</Badge>
          <span className="tnum text-xs font-semibold text-muted">{distanceKm.toFixed(1)} กม. · ข้อมูลวันที่ {reference.observedAt}</span>
        </div>
        <h3 className="tnum mt-2 text-lg font-extrabold">{referencePriceLabel(reference)}</h3>
        <p className="mt-1 text-sm font-semibold text-ink-soft">{reference.propertyType} · {reference.address || "ไม่ระบุที่อยู่"}</p>
        <p className="mt-1 text-xs text-muted">{reference.providerName}{reference.sourceCategory === "market" ? " · ราคาขอขาย" : ""}</p>
        <ReferenceLink reference={reference} />
      </div>
      <div className="self-center">{action}</div>
    </article>
  );
}

function ReferenceLink({ reference }: { reference: PriceReferenceSnapshot }) {
  if (!reference.sourceUrl) return null;
  const className = "mt-2 inline-flex items-center gap-1 text-xs font-bold text-action underline underline-offset-2 break-hard";
  if (reference.sourceUrl.startsWith("/")) return <Link className={className} href={reference.sourceUrl}>เปิดงานต้นทาง</Link>;
  return <a className={className} href={reference.sourceUrl} rel="noreferrer" target="_blank">เปิดแหล่งที่มา <ExternalLink size={12} /></a>;
}

function ImportReferenceForm({ category, criteria, job, team, onImported, onCancel }: {
  category: "official" | "market";
  criteria: ActiveSearchCriteria;
  job: AppraisalJob;
  team: "teamA" | "teamB" | "teamC" | "admin";
  onImported: (snapshot: PriceReferenceSnapshot) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    providerName: category === "official" ? "กรมธนารักษ์" : "",
    sourceUrl: "",
    externalReference: "",
    address: job.property.address,
    latitude: criteria.latitude,
    longitude: criteria.longitude,
    propertyType: criteria.propertyType,
    totalPrice: 0,
    unitPrice: 0,
    unit: (job.property.landArea > 0 ? "perSqWah" : "perSqM") as PriceReferenceUnit,
    landArea: job.property.landArea,
    usableArea: job.property.usableArea,
    observedAt: today,
  });
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.providerName.trim() || !isHttpUrl(form.sourceUrl)) {
      setError("กรุณาระบุชื่อแหล่งข้อมูลและ URL แบบ http/https");
      return;
    }
    if (form.totalPrice <= 0 && form.unitPrice <= 0) {
      setError("กรุณาระบุราคารวมหรือราคาต่อหน่วยอย่างน้อยหนึ่งค่า");
      return;
    }
    const capturedAt = new Date().toISOString();
    onImported({
      id: globalThis.crypto?.randomUUID?.() ?? `reference-${Date.now()}`,
      revisionOf: null,
      sourceCategory: category,
      providerName: form.providerName.trim(),
      sourceUrl: form.sourceUrl.trim(),
      externalReference: form.externalReference.trim(),
      originalJobId: "",
      propertyType: form.propertyType,
      address: form.address.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      totalPrice: form.totalPrice,
      unitPrice: form.unitPrice,
      unit: form.unitPrice > 0 ? form.unit : "none",
      landArea: form.landArea,
      usableArea: form.usableArea,
      observedAt: form.observedAt,
      capturedAt,
      capturedBy: team,
    });
  }

  return (
    <form className="grid gap-4 border-b border-line bg-surface-2/50 p-5 md:grid-cols-2 md:p-6" onSubmit={submit}>
      <div className="md:col-span-2"><Notice>คัดลอกค่าจากหน้าต้นทางที่ตรวจสอบแล้ว ระบบจะเก็บ snapshot นี้ไว้แม้ลิงก์เปิดไม่ได้ในภายหลัง</Notice></div>
      <Field htmlFor="import-provider" label="ชื่อแหล่งข้อมูล">
        <Input id="import-provider" onChange={(event) => setForm({ ...form, providerName: event.target.value })} placeholder="เช่น กรมธนารักษ์ หรือชื่อเว็บไซต์" value={form.providerName} />
      </Field>
      <Field htmlFor="import-ref" label="เลขอ้างอิงจากต้นทาง">
        <Input id="import-ref" onChange={(event) => setForm({ ...form, externalReference: event.target.value })} value={form.externalReference} />
      </Field>
      <div className="md:col-span-2">
        <Field htmlFor="import-url" label="URL ต้นทาง">
          <Input id="import-url" onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://..." type="url" value={form.sourceUrl} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field htmlFor="import-address" label="ที่อยู่ / ทำเล">
          <Textarea id="import-address" onChange={(event) => setForm({ ...form, address: event.target.value })} value={form.address} />
        </Field>
      </div>
      <Field htmlFor="import-lat" label="ละติจูด"><Input id="import-lat" onChange={(event) => setForm({ ...form, latitude: event.target.value })} value={form.latitude} /></Field>
      <Field htmlFor="import-lng" label="ลองจิจูด"><Input id="import-lng" onChange={(event) => setForm({ ...form, longitude: event.target.value })} value={form.longitude} /></Field>
      <Field htmlFor="import-type" label="ประเภททรัพย์"><Select id="import-type" onChange={(event) => setForm({ ...form, propertyType: event.target.value })} value={form.propertyType}>{propertyTypeOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
      <Field htmlFor="import-date" label="วันที่ข้อมูล"><Input id="import-date" onChange={(event) => setForm({ ...form, observedAt: event.target.value })} type="date" value={form.observedAt} /></Field>
      <Field help="บาท" htmlFor="import-total" label="ราคารวม"><Input id="import-total" min="0" onChange={(event) => setForm({ ...form, totalPrice: Number(event.target.value) })} type="number" value={form.totalPrice || ""} /></Field>
      <div className="grid grid-cols-[1fr_9rem] gap-2">
        <Field help="บาท" htmlFor="import-unit-price" label="ราคาต่อหน่วย"><Input id="import-unit-price" min="0" onChange={(event) => setForm({ ...form, unitPrice: Number(event.target.value) })} type="number" value={form.unitPrice || ""} /></Field>
        <Field htmlFor="import-unit" label="หน่วย"><Select id="import-unit" onChange={(event) => setForm({ ...form, unit: event.target.value as PriceReferenceUnit })} value={form.unit}><option value="perSqWah">บาท/ตร.ว.</option><option value="perSqM">บาท/ตร.ม.</option></Select></Field>
      </div>
      <Field help="ตร.วา" htmlFor="import-land" label="เนื้อที่ดิน"><Input id="import-land" min="0" onChange={(event) => setForm({ ...form, landArea: Number(event.target.value) })} type="number" value={form.landArea || ""} /></Field>
      <Field help="ตร.ม." htmlFor="import-usable" label="พื้นที่ใช้สอย"><Input id="import-usable" min="0" onChange={(event) => setForm({ ...form, usableArea: Number(event.target.value) })} type="number" value={form.usableArea || ""} /></Field>
      {error ? <div className="md:col-span-2"><Notice>{error}</Notice></div> : null}
      <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
        <Button onClick={onCancel}>ยกเลิก</Button>
        <Button type="submit" variant="primary"><Plus size={15} />บันทึกและเลือก</Button>
      </div>
    </form>
  );
}

function referencePriceLabel(reference: PriceReferenceSnapshot): string {
  const prices = [];
  if (reference.totalPrice > 0) prices.push(formatMoney(reference.totalPrice));
  if (reference.unitPrice > 0 && reference.unit !== "none") prices.push(`${formatNumber(reference.unitPrice)} ${unitLabels[reference.unit]}`);
  return prices.join(" · ") || "ยังไม่ระบุราคา";
}

function dedupeById(references: PriceReferenceSnapshot[]): PriceReferenceSnapshot[] {
  return [...new Map(references.map((reference) => [reference.id, reference])).values()];
}

function validCoordinates(latitude: string, longitude: string): boolean {
  if (latitude.trim() === "" || longitude.trim() === "") return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function emptyJob(): AppraisalJob | null {
  return null;
}
