"use client";

import {
  FileText,
  Home,
  Landmark,
  LockKeyhole,
  Menu,
  Send,
  ShieldCheck,
  TableProperties,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

type NavLink = { href: string; label: string; icon: ComponentType<{ size?: number; className?: string }> };

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

const footerNote = (
  <p className="text-xs leading-relaxed text-muted">
    บันทึกในเบราว์เซอร์เครื่องนี้อัตโนมัติ
    <br />
    ยังไม่ส่งข้อมูลจริงไปธนาคาร
  </p>
);

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const jobId = pathname.match(/^\/jobs\/([^/]+)/)?.[1];
  const activeJobId = jobId && jobId !== "new" ? jobId : undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // ปิด drawer เองเมื่อเปลี่ยนหน้า ผู้ใช้มือถือจึงไม่ต้องกดปิดซ้ำ
  // ปรับ state ระหว่าง render ตามที่ React แนะนำ ครอบคลุมทั้งการกดลิงก์และปุ่มย้อนกลับ
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;

    const opener = menuButton.current;
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [drawerOpen]);

  const nav = <NavGroups activeJobId={activeJobId} pathname={pathname} />;

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:hidden print:hidden">
        <button
          aria-expanded={drawerOpen}
          aria-label="เปิดเมนู"
          className="-ml-2 grid size-10 place-items-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2"
          onClick={() => setDrawerOpen(true)}
          ref={menuButton}
          type="button"
        >
          <Menu size={20} />
        </button>
        <Link className="text-lg font-extrabold tracking-tight" href="/">
          เรือนราคา
        </Link>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-66 flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex print:hidden">
        <Brand />
        {nav}
        <div className="mt-auto border-t border-line pt-4">{footerNote}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <button
            aria-label="ปิดเมนู"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div
            aria-label="เมนูนำทาง"
            aria-modal="true"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-5 shadow-raised"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <Brand />
              <button
                aria-label="ปิดเมนู"
                className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-surface-2"
                onClick={() => setDrawerOpen(false)}
                ref={closeButton}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            {nav}
            <div className="mt-auto border-t border-line pt-4">{footerNote}</div>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-66">
        <main className="mx-auto w-full max-w-300 px-4 py-6 md:px-6 lg:px-10 lg:py-10 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="grid gap-1">
      <Link className="w-fit text-xl font-extrabold tracking-tight" href="/">
        เรือนราคา
      </Link>
      <p className="text-xs leading-relaxed text-muted">บันทึกงานประเมินบ้านให้เป็นหลักฐานที่เชื่อถือได้</p>
    </div>
  );
}

function NavGroups({ activeJobId, pathname }: { activeJobId?: string; pathname: string }) {
  return (
    <div className="grid gap-6">
      <NavList links={baseLinks} pathname={pathname} />
      {activeJobId ? (
        <NavList
          heading="งานปัจจุบัน"
          links={jobLinks.map(({ segment, label, icon }) => ({
            href: `/jobs/${activeJobId}/${segment}`,
            label,
            icon,
          }))}
          pathname={pathname}
        />
      ) : null}
    </div>
  );
}

function NavList({ heading, links, pathname }: { heading?: string; links: NavLink[]; pathname: string }) {
  return (
    <nav aria-label={heading ?? "เมนูหลัก"} className="grid gap-0.5">
      {heading ? (
        <div className="mb-1 px-3 text-xs font-bold tracking-wide text-faint">{heading}</div>
      ) : null}
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={[
              "relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors duration-150",
              active
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
            href={href}
            key={href}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-2 bottom-2 -left-px w-0.5 rounded-full bg-accent"
              />
            ) : null}
            <Icon className="shrink-0" size={17} />
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
