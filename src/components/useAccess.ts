"use client";

import { useSyncExternalStore } from "react";
import { permissionOf, type MenuKey, type PermissionLevel, type Team } from "@/domain/access";
import { getAccessState, serverAccessState, subscribeToAccess } from "@/infrastructure/storage/accessStore";

function noopSubscribe(): () => void {
  return () => undefined;
}

/**
 * สิทธิ์ของทีมที่ login อยู่
 *
 * `hydrated` แยก "ยังอ่าน localStorage ไม่ได้" ออกจาก "ยังไม่ได้เลือกทีม"
 * ถ้าไม่แยก หน้าจอจะวาบเมนูผิดหรือเด้งไป /login ทุกครั้งที่โหลด
 */
export function useAccess() {
  const state = useSyncExternalStore(subscribeToAccess, getAccessState, serverAccessState);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const team: Team | null = state.currentTeam;

  return {
    hydrated,
    team,
    matrix: state.matrix,
    permission: (menu: MenuKey): PermissionLevel => permissionOf(state.matrix, team, menu),
  };
}
