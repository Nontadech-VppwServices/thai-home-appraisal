"use client";

import { Plus } from "lucide-react";
import { useSyncExternalStore } from "react";
import { calculateValuation, formatMoney, type AppraisalJob } from "@/domain/appraisal";
import { listJobs, subscribeToJobs } from "@/infrastructure/storage/appraisalStore";
import { Badge, LinkButton } from "./ui";

export function Dashboard() {
  const jobs = useSyncExternalStore(subscribeToJobs, listJobs, emptyJobs);

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Home appraisal / cases</div>
          <h1>รายการงานประเมินในเครื่องนี้</h1>
          <p className="intro">เปิดงานร่างเดิมหรือเริ่มงานใหม่ ข้อมูลทั้งหมดใน prototype นี้ยังอยู่ในเบราว์เซอร์เครื่องที่ใช้งาน</p>
        </div>
        <div className="actions">
          <LinkButton href="/jobs/new" variant="primary"><Plus size={16} />สร้างงานใหม่</LinkButton>
        </div>
      </header>

      {jobs.length === 0 ? (
        <section className="empty-state">
          <div>
            <h2>ยังไม่มีงานประเมิน</h2>
            <p className="intro">สร้างงานแรกเพื่อบันทึกเลขที่งาน ข้อมูลทรัพย์ รูปถ่าย และราคาประเมิน</p>
            <div className="action-row" style={{ justifyContent: "center", marginTop: 18 }}>
              <LinkButton href="/jobs/new" variant="primary">สร้างงานใหม่</LinkButton>
            </div>
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>เลขที่งาน</th>
                <th>ผู้ว่าจ้าง</th>
                <th>วันที่ลงพื้นที่</th>
                <th>ธนาคาร</th>
                <th>ราคา</th>
                <th>สถานะ</th>
                <th>เปิดงาน</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const result = calculateValuation(job.property, job.valuation);
                return (
                  <tr key={job.id}>
                    <td><strong>{job.workflow.caseId || "ยังไม่ระบุ"}</strong></td>
                    <td>{job.workflow.clientName || "ยังไม่ระบุ"}</td>
                    <td>{job.workflow.visitDate || "ยังไม่ระบุ"}</td>
                    <td>{job.workflow.bank || "ยังไม่ระบุ"}</td>
                    <td>{formatMoney(result.price)}</td>
                    <td><Badge tone={job.status === "saved" ? "success" : "neutral"}>{job.status === "saved" ? "บันทึกแล้ว" : "แบบร่าง"}</Badge></td>
                    <td><LinkButton href={`/jobs/${job.id}/workflow`} variant="dark">แก้ไข</LinkButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

function emptyJobs(): AppraisalJob[] {
  return [];
}
