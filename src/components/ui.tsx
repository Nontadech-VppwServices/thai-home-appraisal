import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Button({
  children,
  variant = "secondary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "dark" | "danger" }) {
  return (
    <button className={`btn btn-${variant}`} type={type} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, href, variant = "secondary" }: { children: ReactNode; href: string; variant?: "primary" | "secondary" | "dark" }) {
  return (
    <a className={`btn btn-${variant}`} href={href}>
      {children}
    </a>
  );
}

export function Field({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help ? <small>{help}</small> : null}
    </label>
  );
}

export function FormSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="section-title">{eyebrow}</div>
      <h2>{title}</h2>
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
