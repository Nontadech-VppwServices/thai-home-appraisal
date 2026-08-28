import Link from "next/link";
import { nextPhaseRequirements } from "@/domain/appraisal";
import { Badge, LinkButton } from "./ui";

export function FuturePage({ jobId, route }: { jobId?: string; route: string }) {
  const requirement = nextPhaseRequirements.find((item) => item.route === route || (route === "security" && item.route === "security"));

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">{requirement?.id ?? "Future requirement"}</div>
          <h1>{requirement?.title ?? "หน้าระยะถัดไป"}</h1>
          <p className="intro">หน้านี้ถูกออกแบบไว้เพื่อให้ flow ครบทุกหน้า แต่ยังไม่เปิดใช้ความสามารถจริงจนกว่าจะมี requirement และ contract ที่ตรวจสอบได้</p>
        </div>
        <div className="actions">
          {jobId ? <LinkButton href={`/jobs/${jobId}/report`} variant="dark">กลับไปรายงาน</LinkButton> : <LinkButton href="/" variant="dark">กลับรายการงาน</LinkButton>}
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>สถานะการออกแบบ</h2>
          <Badge tone="warning">รอข้อมูลก่อนทำจริง</Badge>
        </div>
        <div className="panel-body">
          <div className="notice">{requirement?.missing ?? "ต้องยืนยันรายละเอียด requirement ก่อน implementation"}</div>
          <div className="grid" style={{ marginTop: 20 }}>
            <div className="success-note">มี route และ navigation สำหรับวาง workflow แล้ว</div>
            <div className="success-note">ยังไม่สร้าง backend, auth, export schema หรือ bank API โดยไม่มีข้อกำหนด</div>
          </div>
          {jobId ? <p className="intro" style={{ marginTop: 20 }}>งานอ้างอิง: <Link href={`/jobs/${jobId}/workflow`}>{jobId}</Link></p> : null}
        </div>
      </section>
    </>
  );
}
