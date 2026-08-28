"use client";

import { Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { calculateValuation, formatMoney, formatNumber, type AppraisalJob } from "@/domain/appraisal";
import { getJob, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { Badge, Button } from "./ui";

export function ReportPage({ jobId }: { jobId: string }) {
  const job = useSyncExternalStore(subscribeToJobs, () => getJob(jobId), emptyJob);

  if (!job) return <div className="empty-state"><div><h1>ไม่พบงานประเมินนี้</h1><Link className="btn btn-primary" href="/jobs/new">สร้างงานใหม่</Link></div></div>;

  const valuation = calculateValuation(job.property, job.valuation);

  return (
    <>
      <header className="page-head no-print">
        <div>
          <div className="eyebrow">REQ-REPORT-001 / REQ-REPORT-002</div>
          <h1>ตรวจรายงานก่อนพิมพ์</h1>
          <p className="intro">รายงานนี้รวมข้อมูลทรัพย์ รูปภาพ และที่มาของราคาประเมิน เพื่อเลือกปลายทางเป็น PDF จากกล่องพิมพ์ของเบราว์เซอร์</p>
        </div>
        <div className="actions">
          <Button onClick={() => window.print()} variant="primary"><Printer size={15} />พิมพ์ / บันทึก PDF</Button>
          <Link className="btn btn-dark" href={`/jobs/${job.id}/valuation`}>กลับไปแก้ราคา</Link>
        </div>
      </header>

      <article className="report-sheet">
        <div className="page-head" style={{ marginBottom: 10 }}>
          <div>
            <div className="eyebrow">รายงานประเมินราคาบ้าน</div>
            <h1>{job.workflow.caseId || "ยังไม่ระบุเลขที่งาน"}</h1>
            <p className="intro">จัดทำเพื่อใช้ตรวจสอบภายใน prototype ยังไม่ส่งข้อมูลจริงไปธนาคาร</p>
          </div>
          <Badge tone={job.status === "saved" ? "success" : "neutral"}>{job.status === "saved" ? "บันทึกแล้ว" : "แบบร่าง"}</Badge>
        </div>

        <section className="report-grid">
          <ReportField label="วันที่ลงพื้นที่" value={job.workflow.visitDate} />
          <ReportField label="ผู้ว่าจ้าง" value={job.workflow.clientName} />
          <ReportField label="ธนาคารปลายทาง" value={job.workflow.bank} />
          <ReportField label="ราคาประเมิน" value={formatMoney(valuation.price)} />
          <ReportField label="วิธีประเมิน" value={valuation.basis} />
          <ReportField label="พื้นที่ใช้สอย" value={`${formatNumber(job.property.usableArea)} ตร.ม.`} />
          <ReportField label="เนื้อที่ดิน" value={`${formatNumber(job.property.landArea)} ตร.วา`} />
          <ReportField label="ประเภท / สภาพ" value={`${job.property.propertyType} / ${job.property.condition}`} />
          <ReportField label="จำนวนชั้น" value={`${formatNumber(job.property.floors)} ชั้น`} />
          <ReportField label="ปีที่สร้าง" value={job.property.buildYear ? String(job.property.buildYear) : "ยังไม่ระบุ"} />
          <ReportField label="ห้องนอน / ห้องน้ำ" value={`${formatNumber(job.property.bedrooms)} / ${formatNumber(job.property.bathrooms)}`} />
          <ReportField label="พิกัด" value={`${job.property.latitude || "-"}, ${job.property.longitude || "-"}`} />
          <ReportField label="ที่อยู่" value={job.property.address} wide />
          <ReportField label="รายละเอียดเพิ่มเติม" value={job.property.description} wide />
        </section>

        <h2>รูปถ่ายหลักฐาน</h2>
        {job.photos.length === 0 ? <div className="empty-state" style={{ marginTop: 12 }}>ยังไม่มีรูปหลักฐานในรายงาน</div> : null}
        <div className="report-photos" style={{ marginTop: 12 }}>
          {job.photos.map((photo) => <Image alt={photo.name} className="photo" height={360} key={photo.id} src={photo.dataUrl} unoptimized width={360} />)}
        </div>

        <div className="notice" style={{ marginTop: 24 }}>ข้อจำกัด: prototype นี้ยังไม่ส่งข้อมูลไปธนาคารจริง จนกว่าจะยืนยัน API หรือแบบฟอร์มของธนาคารเป้าหมาย</div>
      </article>
    </>
  );
}

function emptyJob(): AppraisalJob | null {
  return null;
}

function ReportField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`report-field ${wide ? "full" : ""}`}>
      <span>{label}</span>
      <strong>{value || "ยังไม่ระบุ"}</strong>
    </div>
  );
}
