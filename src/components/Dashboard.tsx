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
            <div className="action-row action-center">
              <LinkButton href="/jobs/new" variant="primary">สร้างงานใหม่</LinkButton>
            </div>
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <>
          <div className="table-wrap dashboard-table">
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

          <div className="mobile-job-list" aria-label="รายการงานประเมินสำหรับมือถือ">
            {jobs.map((job) => {
              const result = calculateValuation(job.property, job.valuation);
              return (
                <article className="job-card panel" key={job.id}>
                  <div className="job-card-head">
                    <div>
                      <div className="job-card-label">เลขที่งาน</div>
                      <h2>{job.workflow.caseId || "ยังไม่ระบุ"}</h2>
                    </div>
                    <Badge tone={job.status === "saved" ? "success" : "neutral"}>{job.status === "saved" ? "บันทึกแล้ว" : "แบบร่าง"}</Badge>
                  </div>
                  <dl className="job-card-meta">
                    <div><dt>ผู้ว่าจ้าง</dt><dd>{job.workflow.clientName || "ยังไม่ระบุ"}</dd></div>
                    <div><dt>วันที่ลงพื้นที่</dt><dd>{job.workflow.visitDate || "ยังไม่ระบุ"}</dd></div>
                    <div><dt>ธนาคาร</dt><dd>{job.workflow.bank || "ยังไม่ระบุ"}</dd></div>
                    <div><dt>ราคา</dt><dd>{formatMoney(result.price)}</dd></div>
                  </dl>
                  <LinkButton className="job-card-action" href={`/jobs/${job.id}/workflow`} variant="dark">แก้ไขงานนี้</LinkButton>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

function emptyJobs(): AppraisalJob[] {
  return [];
}
