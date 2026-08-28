"use client";

import { FileText, Home, Landmark, LockKeyhole, Send, ShieldCheck, TableProperties } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const baseLinks = [
  { href: "/", label: "รายการประเมิน", icon: Home },
  { href: "/jobs/new", label: "สร้างงาน", icon: FileText },
  { href: "/security", label: "ความปลอดภัย", icon: LockKeyhole },
];

const jobLinks = [
  { segment: "workflow", label: "ข้อมูลงาน", icon: FileText },
  { segment: "property", label: "ทรัพย์สิน", icon: Home },
  { segment: "photos", label: "รูปถ่าย", icon: TableProperties },
  { segment: "valuation", label: "ประเมินราคา", icon: Landmark },
  { segment: "report", label: "รายงาน", icon: ShieldCheck },
  { segment: "review", label: "ตรวจสอบ", icon: ShieldCheck },
  { segment: "export", label: "ส่งออก", icon: TableProperties },
  { segment: "integration", label: "ส่งธนาคาร", icon: Send },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const jobId = pathname.match(/^\/jobs\/([^/]+)/)?.[1];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <Link className="brand" href="/">เรือนราคา</Link>
          <div className="brand-note">บันทึกงานประเมินบ้านให้เป็นหลักฐานที่เชื่อถือได้</div>
        </div>

        <nav className="side-nav" aria-label="เมนูหลัก">
          {baseLinks.map(({ href, label, icon: Icon }) => (
            <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={href}>
              <Icon aria-hidden="true" size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {jobId && jobId !== "new" ? (
          <nav className="side-nav job-nav" aria-label="เมนูงานประเมิน">
            <div className="nav-heading">งานปัจจุบัน</div>
            {jobLinks.map(({ segment, label, icon: Icon }) => {
              const href = `/jobs/${jobId}/${segment}`;
              return (
                <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={segment}>
                  <Icon aria-hidden="true" size={16} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="side-footer">บันทึกในเบราว์เซอร์เครื่องนี้อัตโนมัติ<br />ยังไม่ส่งข้อมูลจริงไปธนาคาร</div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
