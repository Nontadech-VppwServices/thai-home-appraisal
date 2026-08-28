"use client";

import { ArrowRight, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { teamProfiles, teams, type Team } from "@/domain/access";
import { signIn } from "@/infrastructure/storage/accessStore";
import { useAccess } from "./useAccess";

export function LoginPage() {
  const router = useRouter();
  const { team: currentTeam } = useAccess();

  function enter(team: Team) {
    signIn(team);
    router.replace("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-10 md:px-6">
      <header className="mb-7">
        <p className="text-xs font-bold tracking-wide text-accent">เรือนราคา</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-extrabold text-balance md:text-3xl">
          เลือกทีมที่ต้องการเข้าใช้งาน
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
          แต่ละทีมเห็นเมนูและแก้ไขข้อมูลได้ต่างกันตามหน้าที่ในสายงาน A → B → C
        </p>
      </header>

      <div
        className="mb-6 flex items-start gap-3 rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm leading-relaxed text-warning"
        role="note"
      >
        <ShieldAlert className="mt-0.5 shrink-0" size={16} />
        <span>
          <strong className="font-bold">โหมด demo</strong> — ปุ่มด้านล่างข้ามการยืนยันตัวตน
          ไม่ใช่ระบบ login จริง และสิทธิ์ถูกบังคับที่ฝั่งเบราว์เซอร์เท่านั้น
        </span>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {teams.map((team) => {
          const profile = teamProfiles[team];
          const active = team === currentTeam;
          return (
            <li key={team}>
              <button
                className="group flex h-full w-full flex-col items-start gap-2 rounded-panel border border-line bg-surface p-5 text-left shadow-panel transition-colors duration-150 hover:border-accent hover:bg-accent-soft/40"
                onClick={() => enter(team)}
                type="button"
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 min-w-9 shrink-0 place-items-center rounded-full bg-accent-soft px-2.5 text-sm font-extrabold text-accent-ink">
                      {profile.short}
                    </span>
                    <span className="text-base font-bold">{profile.label}</span>
                  </span>
                  {active ? (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-ink">
                      ทีมล่าสุด
                    </span>
                  ) : (
                    <ArrowRight
                      aria-hidden="true"
                      className="shrink-0 text-faint transition-colors duration-150 group-hover:text-accent"
                      size={18}
                    />
                  )}
                </span>
                <span className="text-sm leading-relaxed font-semibold text-ink-soft">{profile.duty}</span>
                <span className="text-xs leading-relaxed text-muted">{profile.scope}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        สลับทีมได้ตลอดเวลาจากเมนูด้านล่างซ้ายหลังเข้าระบบ · สิทธิ์ตั้งต้นอ้างอิงตารางใน REQ-ROLE-001
      </p>
    </main>
  );
}
