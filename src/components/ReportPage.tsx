"use client";

import { Printer } from "lucide-react";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { canView } from "@/domain/access";
import { calculateValuation, formatMoney, formatNumber, type AppraisalJob } from "@/domain/appraisal";
import { sourceLabels, summarizePriceReferences, unitLabels, type PriceReferenceSnapshot } from "@/domain/priceReferences";
import { getJob, getSelectedPriceReferences, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { AccessBanner, Button, EmptyState, LinkButton, PageHeader, StatusBadge } from "./ui";
import { useAccess } from "./useAccess";
import { JobContext } from "./JobContext";

const UNSET = "ยังไม่ระบุ";

export function ReportPage({ jobId }: { jobId: string }) {
  const { permission } = useAccess();
  const hidden = !canView(permission("report"));
  const job = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);

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
  const references = getSelectedPriceReferences(job);
  const referenceSummaries = summarizePriceReferences(references);

  return (
    <>
      <div className="print:hidden">
        {hidden ? <AccessBanner level="none" ownerLabel={null} /> : null}
        <PageHeader
          actions={
            <>
              <Button className="w-full sm:w-auto" onClick={() => window.print()} variant="primary">
                <Printer size={15} />
                พิมพ์ / บันทึก PDF
              </Button>
              <LinkButton className="w-full sm:w-auto" href={`/jobs/${job.id}/valuation`}>
                กลับไปแก้ราคา
              </LinkButton>
            </>
          }
          description="รายงานนี้รวมข้อมูลทรัพย์ รูปภาพ และที่มาของราคาประเมิน เลือกปลายทางเป็น PDF ได้จากกล่องพิมพ์ของเบราว์เซอร์"
          eyebrow="ตรวจก่อนพิมพ์"
          title="ตรวจรายงานก่อนพิมพ์"
        />
        <JobContext job={job} />
      </div>

      <article className="report-sheet rounded-shell border border-line p-6 shadow-panel md:p-10 print:border-0 print:shadow-none">
        <header className="report-head report-line flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div className="min-w-0">
            <p className="report-muted text-xs font-bold tracking-wide">รายงานประเมินราคาบ้าน</p>
            <h1 className="mt-1 text-2xl font-extrabold break-hard md:text-3xl">
              {job.workflow.caseId || "ยังไม่ระบุเลขที่งาน"}
            </h1>
            <p className="report-muted mt-2 max-w-xl text-sm leading-relaxed">
              จัดทำเพื่อใช้ตรวจสอบภายใน prototype ยังไม่ส่งข้อมูลจริงไปธนาคาร
            </p>
          </div>
          <StatusBadge status={job.status} />
        </header>

        <dl className="my-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
          <ReportField label="วันที่ลงพื้นที่" value={job.workflow.visitDate} />
          <ReportField label="ผู้ว่าจ้าง" value={job.workflow.clientName} />
          <ReportField label="ธนาคารปลายทาง" value={job.workflow.bank} />
          <ReportField label="ราคาประเมิน" value={formatMoney(valuation.price)} />
          <ReportField label="วิธีประเมิน" value={valuation.basis} />
          <ReportField label="พื้นที่ใช้สอย" value={`${formatNumber(job.property.usableArea)} ตร.ม.`} />
          <ReportField label="เนื้อที่ดิน" value={`${formatNumber(job.property.landArea)} ตร.วา`} />
          <ReportField label="ประเภท / สภาพ" value={`${job.property.propertyType} / ${job.property.condition}`} />
          <ReportField label="จำนวนชั้น" value={`${formatNumber(job.property.floors)} ชั้น`} />
          <ReportField label="ปีที่สร้าง" value={job.property.buildYear ? String(job.property.buildYear) : UNSET} />
          <ReportField
            label="ห้องนอน / ห้องน้ำ"
            value={`${formatNumber(job.property.bedrooms)} / ${formatNumber(job.property.bathrooms)}`}
          />
          <ReportField label="พิกัด" value={`${job.property.latitude || "-"}, ${job.property.longitude || "-"}`} />
          <ReportField label="ที่อยู่" value={job.property.address} wide />
          <ReportField label="รายละเอียดเพิ่มเติม" value={job.property.description} wide />
        </dl>

        <section className="report-line border-t pt-5">
          <h2 className="text-lg font-bold">ข้อมูลอ้างอิงราคา</h2>
          {references.length === 0 ? (
            <p className="report-muted mt-2 text-sm">ไม่มีข้อมูลอ้างอิงที่เลือกไว้ ผู้ประเมินดำเนินงานต่อได้โดยระบบไม่บล็อก</p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {referenceSummaries.map((summary) => (
                  <div className="report-line rounded-lg border p-3" key={`${summary.sourceCategory}-${summary.unit}`}>
                    <div className="report-muted text-xs font-bold">{sourceLabels[summary.sourceCategory]} · {unitLabels[summary.unit]}</div>
                    <div className="tnum mt-1 text-sm font-semibold">
                      {formatNumber(summary.minimum)} – <strong>{formatNumber(summary.median)}</strong> – {formatNumber(summary.maximum)}
                    </div>
                    <div className="report-muted mt-1 text-xs">ต่ำสุด · ค่ากลาง · สูงสุด ({summary.count} รายการ)</div>
                  </div>
                ))}
              </div>
              <ol className="mt-4 grid gap-3">
                {references.map((reference, index) => {
                  const selection = job.selectedReferences.find((item) => item.referenceId === reference.id);
                  return (
                    <li className="report-line rounded-lg border p-4" key={reference.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <strong className="text-sm">{index + 1}. {sourceLabels[reference.sourceCategory]}</strong>
                        <span className="tnum text-sm font-extrabold">{referencePriceLabel(reference)}</span>
                      </div>
                      <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs md:grid-cols-2">
                        <ReportField label="แหล่งข้อมูล" value={reference.providerName} />
                        <ReportField label="วันที่ข้อมูล / วันที่นำเข้า" value={`${reference.observedAt || UNSET} / ${reference.capturedAt.slice(0, 10) || UNSET}`} />
                        <ReportField label="ประเภท / พื้นที่" value={`${reference.propertyType || UNSET} · ${reference.landArea ? `${formatNumber(reference.landArea)} ตร.วา` : "-"} · ${reference.usableArea ? `${formatNumber(reference.usableArea)} ตร.ม.` : "-"}`} />
                        <ReportField label="พิกัด" value={`${reference.latitude || "-"}, ${reference.longitude || "-"}`} />
                        <ReportField label="ที่อยู่" value={reference.address} wide />
                        <ReportField label="หมายเหตุการปรับเทียบ" value={selection?.adjustmentNote || "ไม่ได้ระบุ"} wide />
                        <ReportField label="URL ต้นทาง" value={reference.sourceUrl || "ข้อมูลเดิมไม่ทราบ URL"} wide />
                      </dl>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <section className="report-line border-t pt-5">
          <h2 className="text-lg font-bold">รูปถ่ายหลักฐาน</h2>
          {job.photos.length === 0 ? (
            <p className="report-muted mt-2 text-sm">ยังไม่มีรูปหลักฐานในรายงาน</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {job.photos.map((photo) => (
                <li
                  className="report-photo report-line aspect-square overflow-hidden rounded-lg border"
                  key={photo.id}
                >
                  <Image
                    alt={photo.name}
                    className="size-full object-cover"
                    height={360}
                    src={photo.dataUrl}
                    unoptimized
                    width={360}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="report-muted report-line mt-6 border-t pt-4 text-xs leading-relaxed">
          ข้อจำกัด: prototype นี้ยังไม่ส่งข้อมูลไปธนาคารจริง จนกว่าจะยืนยัน API หรือแบบฟอร์มของธนาคารเป้าหมาย
        </p>
      </article>
    </>
  );
}

function referencePriceLabel(reference: PriceReferenceSnapshot): string {
  const prices: string[] = [];
  if (reference.totalPrice > 0) prices.push(formatMoney(reference.totalPrice));
  if (reference.unitPrice > 0 && reference.unit !== "none") {
    prices.push(`${formatNumber(reference.unitPrice)} ${unitLabels[reference.unit]}`);
  }
  return prices.join(" · ") || UNSET;
}

function emptyJob(): AppraisalJob | null {
  return null;
}

function ReportField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "min-w-0 md:col-span-2" : "min-w-0"}>
      <dt className="report-muted text-xs font-bold tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed font-semibold break-hard whitespace-pre-wrap">{value || UNSET}</dd>
    </div>
  );
}
