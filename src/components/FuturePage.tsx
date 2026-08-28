import Link from "next/link";
import { nextPhaseRequirements } from "@/domain/appraisal";
import { Badge, LinkButton, Notice, PageHeader, Panel, PanelBody, PanelHead } from "./ui";

export function FuturePage({ jobId, route }: { jobId?: string; route: string }) {
  const requirement = nextPhaseRequirements.find((item) => item.route === route);

  return (
    <>
      <PageHeader
        actions={
          jobId ? (
            <LinkButton className="w-full sm:w-auto" href={`/jobs/${jobId}/report`}>
              กลับไปรายงาน
            </LinkButton>
          ) : (
            <LinkButton className="w-full sm:w-auto" href="/">
              กลับรายการงาน
            </LinkButton>
          )
        }
        description="หน้านี้ถูกออกแบบไว้เพื่อให้ flow ครบทุกหน้า แต่ยังไม่เปิดใช้ความสามารถจริงจนกว่าจะมี requirement และ contract ที่ตรวจสอบได้"
        eyebrow="ระยะถัดไป"
        title={requirement?.title ?? "หน้าระยะถัดไป"}
      />

      <Panel>
        <PanelHead
          aside={<Badge tone="warning">รอข้อมูลก่อนทำจริง</Badge>}
          title="สถานะการออกแบบ"
        />
        <PanelBody className="grid gap-4">
          <Notice>{requirement?.missing ?? "ต้องยืนยันรายละเอียด requirement ก่อน implementation"}</Notice>
          <div className="grid gap-3 md:grid-cols-2">
            <Notice tone="success">มี route และ navigation สำหรับวาง workflow แล้ว</Notice>
            <Notice tone="success">ยังไม่สร้าง backend, auth, export schema หรือ bank API โดยไม่มีข้อกำหนด</Notice>
          </div>
          {jobId ? (
            <p className="text-sm text-muted">
              งานอ้างอิง:{" "}
              <Link className="font-semibold text-accent underline underline-offset-2 break-hard" href={`/jobs/${jobId}/workflow`}>
                {jobId}
              </Link>
            </p>
          ) : null}
        </PanelBody>
      </Panel>
    </>
  );
}
