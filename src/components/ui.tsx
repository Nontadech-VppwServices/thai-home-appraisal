import type { ReactNode } from "react";

function classes(...items: Array<string | undefined>) {
  return items.filter(Boolean).join(" ");
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger"; className?: string }) {
  return <span className={classes("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function Button({
  children,
  variant = "secondary",
  type = "button",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "dark" | "danger" }) {
  return (
    <button className={classes("btn", `btn-${variant}`, className)} type={type} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, href, variant = "secondary", className }: { children: ReactNode; href: string; variant?: "primary" | "secondary" | "dark"; className?: string }) {
  return (
    <a className={classes("btn", `btn-${variant}`, className)} href={href}>
      {children}
    </a>
  );
}

export function Field({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}{help ? <small> ({help})</small> : null}</span>
      {children}
     
    </label>
  );
}

export function FormSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="form-section-head">
        <div className="section-title">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div className={`toast ${message ? "show" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
