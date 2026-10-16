"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";

export function MobilePropertySheet({ children, isMobile, onClose, open }: { children: ReactNode; isMobile: boolean; onClose: () => void; open: boolean }) {
  if (!isMobile) return children;
  return createPortal(<>
    {open ? <button aria-label="ปิดแผงคุณสมบัติ" className="drawing-properties-backdrop" onClick={onClose} tabIndex={-1} type="button" /> : null}
    {children}
  </>, document.body);
}
