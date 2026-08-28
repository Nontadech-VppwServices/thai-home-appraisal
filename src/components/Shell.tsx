"use client";

import {
  ChartColumn,
  FileText,
  Database,
  Home,
  Landmark,
  LockKeyhole,
  Menu,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  TableProperties,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { canView, menuCatalog, teamProfiles, type MenuKey, type PermissionMatrix, type Team } from "@/domain/access";
import { signOut } from "@/infrastructure/storage/accessStore";
import { useAccess } from "./useAccess";

type IconType = ComponentType<{ size?: number; className?: string }>;
type NavLink = { href: string; label: string; icon: IconType };

const menuIcons: Record<MenuKey, IconType> = {
  jobs: Home,
  newJob: FileText,
  insights: ChartColumn,
  permissions: SlidersHorizontal,
  security: LockKeyhole,
  intake: Landmark,
  workflow: FileText,
  property: Home,
  photos: TableProperties,
  references: Database,
  valuation: Landmark,
  report: ShieldCheck,
  review: ShieldCheck,
  export: TableProperties,
  handoff: Send,
  integration: Send,
};

const baseMenus = menuCatalog.filter((entry) => entry.href);
const jobMenus = menuCatalog.filter((entry) => entry.segment);

const footerNote = (
  <p className="text-xs leading-relaxed text-muted">
    บันทึกในเบราว์เซอร์เครื่องนี้อัตโนมัติ
    <br />
    ยังไม่ส่งข้อมูลจริงไปธนาคาร
  </p>
);

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, team, matrix } = useAccess();

  const jobId = pathname.match(/^\/jobs\/([^/]+)/)?.[1];
  const activeJobId = jobId && jobId !== "new" ? jobId : undefined;
  const onLoginPage = pathname === "/login";

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

  // ยังไม่เลือกทีม -> ไปหน้าเลือกทีม ตรวจหลัง hydrate เท่านั้น
  useEffect(() => {
    if (hydrated && !team && !onLoginPage) router.replace("/login");
  }, [hydrated, onLoginPage, router, team]);

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

  if (onLoginPage) return <>{children}</>;

  // ระหว่างที่ยังไม่รู้ว่าใคร login อยู่ ยังไม่วาดเมนู กันเมนูผิดทีมกะพริบ
  if (!hydrated || !team) return <div className="min-h-dvh bg-canvas" />;

  const nav = (
    <NavGroups activeJobId={activeJobId} matrix={matrix} pathname={pathname} team={team} />
  );
  const identity = <TeamCard onSignOut={() => router.replace("/login")} team={team} />;

  return (
    <div className="min-h-dvh bg-canvas">
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
        <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-ink">
          {teamProfiles[team].label}
        </span>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-66 flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex print:hidden">
        <Brand />
        {nav}
        <div className="mt-auto grid gap-4 border-t border-line pt-4">
          {identity}
          {footerNote}
        </div>
      </aside>

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
            <div className="mt-auto grid gap-4 border-t border-line pt-4">
              {identity}
              {footerNote}
            </div>
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

/** แสดงทีมปัจจุบันและสลับทีมได้ทันที เพื่อให้ demo เทียบสิทธิ์ได้เร็ว */
function TeamCard({ team, onSignOut }: { team: Team; onSignOut: () => void }) {
  const profile = teamProfiles[team];
  return (
    <div className="grid gap-2 rounded-control border border-line bg-surface-2 p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full bg-accent-soft px-2 text-xs font-extrabold text-accent-ink">
          {profile.short}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold">{profile.label}</div>
          <div className="truncate text-xs text-muted">กำลังใช้งาน</div>
        </div>
      </div>
      <button
        className="min-h-9 rounded-control border border-line-strong bg-surface text-xs font-bold text-ink-soft transition-colors duration-150 hover:bg-surface-3"
        onClick={() => {
          signOut();
          onSignOut();
        }}
        type="button"
      >
        สลับทีม / ออกจากระบบ
      </button>
    </div>
  );
}

function NavGroups({
  activeJobId,
  matrix,
  pathname,
  team,
}: {
  activeJobId?: string;
  matrix: PermissionMatrix;
  pathname: string;
  team: Team;
}) {
  const visible = (key: MenuKey) => canView(matrix[team][key]);

  const base: NavLink[] = baseMenus
    .filter((entry) => visible(entry.key))
    .map((entry) => ({ href: entry.href as string, label: entry.label, icon: menuIcons[entry.key] }));

  const jobs: NavLink[] = activeJobId
    ? jobMenus
        .filter((entry) => visible(entry.key))
        .map((entry) => ({
          href: `/jobs/${activeJobId}/${entry.segment}`,
          label: entry.label,
          icon: menuIcons[entry.key],
        }))
    : [];

  return (
    <div className="grid gap-6">
      <NavList links={base} pathname={pathname} />
      {jobs.length > 0 ? <NavList heading="งานปัจจุบัน" links={jobs} pathname={pathname} /> : null}
    </div>
  );
}

function NavList({ heading, links, pathname }: { heading?: string; links: NavLink[]; pathname: string }) {
  if (links.length === 0) return null;

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
