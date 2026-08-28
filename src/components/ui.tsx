import Link from "next/link";
import { ChevronDown, EyeOff, Lock, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { statusLabels, type JobStatus } from "@/domain/appraisal";

function classes(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

/* --------------------------------------------------------------------------
   Button / LinkButton
-------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control border font-semibold leading-tight " +
  "whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-sm",
  sm: "min-h-9 px-3 text-xs",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:bg-accent-strong hover:border-accent-strong dark:text-canvas",
  secondary: "border-line-strong bg-surface text-ink hover:bg-surface-2 hover:border-line-strong",
  ghost: "border-transparent bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink",
  danger: "border-danger bg-danger text-white hover:opacity-90",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return classes(buttonBase, buttonSizes[size], buttonVariants[variant], className);
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  type = "button",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button className={buttonClasses(variant, size, className)} type={type} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "secondary",
  size = "md",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link className={buttonClasses(variant, size, className)} href={href}>
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------------------
   Form controls
-------------------------------------------------------------------------- */

const controlBase =
  "w-full min-h-11 rounded-control border border-line-strong bg-surface text-ink " +
  "px-3.5 py-2.5 text-sm leading-relaxed transition-colors duration-150 " +
  "placeholder:text-faint hover:border-line-strong " +
  "focus:border-action focus:outline-none focus:ring-4 focus:ring-action/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={classes(controlBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classes(controlBase, "min-h-28 resize-y", className)} rows={4} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={classes(controlBase, "cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
        size={16}
      />
    </div>
  );
}

export function Field({
  label,
  children,
  help,
  error,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  help?: string;
  error?: string;
  htmlFor?: string;
}) {
  const Wrapper = htmlFor ? "div" : "label";
  return (
    <Wrapper className="grid min-w-0 gap-1.5">
      <label className="text-sm font-semibold text-ink-soft" htmlFor={htmlFor}>
        {label}
        {help ? <span className="ml-1 font-normal text-muted">({help})</span> : null}
      </label>
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </Wrapper>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 p-5 md:p-6">
      <div className="grid gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/* --------------------------------------------------------------------------
   Surfaces
-------------------------------------------------------------------------- */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={classes(
        "overflow-hidden rounded-panel border border-line bg-surface shadow-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
      <div className="grid min-w-0 gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes("p-5 md:p-6", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-bold tracking-wide text-accent break-hard">{eyebrow}</p>
        ) : null}
        <h1 className="max-w-2xl text-2xl leading-tight font-extrabold text-balance lg:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted lg:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:shrink-0">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes(
        "grid place-items-center rounded-panel border border-dashed border-line-strong bg-surface-2/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid justify-items-center gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {description ? <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Status / data display
-------------------------------------------------------------------------- */

type BadgeTone = "neutral" | "accent" | "action" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-ink-soft",
  accent: "bg-accent-soft text-accent-ink",
  action: "bg-action-soft text-action",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={classes(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTones: Record<JobStatus, BadgeTone> = {
  intake: "neutral",
  assigned: "accent",
  changesRequested: "warning",
  readyToSubmit: "action",
  submitted: "success",
};

/** สถานะงานถูกใช้ซ้ำในหลายหน้า จึงรวมการแปลงค่าไว้จุดเดียว */
export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge tone={statusTones[status]}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={classes(
        "rounded-panel border p-4 md:p-5",
        highlight ? "border-accent/35 bg-accent-soft" : "border-line bg-surface shadow-panel",
      )}
    >
      <div
        className={classes(
          "text-xs font-bold tracking-wide",
          highlight ? "text-accent-ink" : "text-muted",
        )}
      >
        {label}
      </div>
      <div
        className={classes(
          "tnum mt-1.5 text-xl font-extrabold break-hard md:text-2xl",
          highlight ? "text-accent-ink" : "text-ink",
        )}
      >
        {value}
        {unit ? <span className="ml-1 text-sm font-semibold text-muted">{unit}</span> : null}
      </div>
    </div>
  );
}

export function PriceSummary({ price, basis }: { price: string; basis: string }) {
  return (
    <section className="overflow-hidden rounded-panel bg-linear-to-br from-[#0b5f68] to-[#0f766e] p-5 text-white shadow-raised md:p-6">
      <div className="text-xs font-bold tracking-wide text-teal-100">ราคาประเมิน</div>
      <div className="tnum mt-2 text-3xl leading-tight font-extrabold break-hard text-price">{price}</div>
      <p className="mt-3 border-t border-white/15 pt-3 text-sm leading-relaxed text-teal-50/90">{basis}</p>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Stepper
-------------------------------------------------------------------------- */

export function Stepper({
  steps,
  currentIndex,
}: {
  steps: { href: string; label: string }[];
  currentIndex: number;
}) {
  return (
    <nav aria-label="ขั้นตอนงานประเมิน" className="mb-6 print:hidden">
      <ol className="scroll-fade-x flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const current = index === currentIndex;
          const done = index < currentIndex;
          return (
            <li className="shrink-0 snap-start" key={step.href}>
              <Link
                aria-current={current ? "step" : undefined}
                className={classes(
                  "flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold transition-colors duration-150",
                  current
                    ? "bg-accent text-white dark:text-canvas"
                    : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
                href={step.href}
              >
                <span
                  className={classes(
                    "tnum grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    current
                      ? "bg-white/20 text-white dark:bg-canvas/25 dark:text-canvas"
                      : done
                        ? "bg-accent-soft text-accent-ink"
                        : "bg-surface-3 text-muted",
                  )}
                >
                  {index + 1}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* --------------------------------------------------------------------------
   Photo uploader
-------------------------------------------------------------------------- */

export function PhotoUploader({
  inputId,
  count,
  max,
  onAdd,
  children,
}: {
  inputId: string;
  count: number;
  max: number;
  onAdd: (event: React.ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  const full = count >= max;
  return (
    <div className="grid gap-4">
      <label
        className={classes(
          "grid min-h-36 place-items-center rounded-panel border border-dashed px-6 py-8 text-center transition-colors duration-150",
          full
            ? "cursor-not-allowed border-line bg-surface-2 text-muted"
            : "cursor-pointer border-line-strong bg-surface-2/60 text-muted hover:border-accent hover:bg-accent-soft/50",
        )}
        htmlFor={inputId}
      >
        <span className="grid gap-1">
          <strong className="text-base font-bold text-accent">
            {full ? `ครบ ${max} รูปแล้ว` : "แตะเพื่อเพิ่มรูปถ่าย"}
          </strong>
          <span className="text-sm leading-relaxed">
            รูปด้านหน้า บ้านเลขที่ ภายในบ้าน ถนน และสภาพแวดล้อม
          </span>
          <span className="tnum text-xs font-semibold text-faint">
            {count} / {max} รูป
          </span>
        </span>
      </label>
      <input
        accept="image/*"
        className="sr-only"
        disabled={full}
        id={inputId}
        multiple
        onChange={onAdd}
        type="file"
      />
      {children}
    </div>
  );
}

export function PhotoTile({
  children,
  name,
  onRemove,
}: {
  children: ReactNode;
  name: string;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-control border border-line bg-surface-2">
      {children}
      <button
        aria-label={`ลบ ${name}`}
        className="absolute top-1.5 right-1.5 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-danger"
        onClick={onRemove}
        type="button"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Feedback
-------------------------------------------------------------------------- */

export function Toast({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      className={classes(
        "fixed inset-x-4 bottom-4 z-50 mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-control bg-ink px-5 py-3.5",
        "text-sm leading-snug text-canvas shadow-raised transition-all duration-200 sm:right-6 sm:left-auto sm:mx-0",
        message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
      role="status"
    >
      {message}
    </div>
  );
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "success" }) {
  return (
    <div
      className={classes(
        "rounded-control border px-4 py-3 text-sm leading-relaxed",
        tone === "warning"
          ? "border-warning/30 bg-warning-soft text-warning"
          : "border-success/30 bg-success-soft text-success",
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Access / permission
-------------------------------------------------------------------------- */

export function SegmentedControl<Value extends string>({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (next: Value) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className={classes(
        "inline-grid w-full gap-0.5 rounded-control border border-line bg-surface-2 p-0.5",
        disabled && "opacity-60",
      )}
      role="radiogroup"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-checked={active}
            className={classes(
              "min-h-9 rounded-[7px] px-2 text-xs font-bold transition-colors duration-150",
              active ? "bg-accent text-white shadow-panel dark:text-canvas" : "text-muted hover:text-ink",
              disabled && "cursor-not-allowed",
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** บอกผู้ใช้ว่าทำไมหน้านี้แก้ไม่ได้ ใช้คู่กับ fieldset disabled */
export function AccessBanner({ level, ownerLabel }: { level: "none" | "read"; ownerLabel?: string | null }) {
  const forOwner = ownerLabel ? `เมนูนี้เป็นของ${ownerLabel}` : "เมนูนี้ไม่ใช่ของทีมคุณ";
  return (
    <div
      className={classes(
        "mb-6 flex items-start gap-3 rounded-control border px-4 py-3 text-sm leading-relaxed",
        level === "none"
          ? "border-warning/30 bg-warning-soft text-warning"
          : "border-line bg-surface-2 text-ink-soft",
      )}
      role="status"
    >
      {level === "none" ? <EyeOff className="mt-0.5 shrink-0" size={16} /> : <Lock className="mt-0.5 shrink-0" size={16} />}
      <span>
        {level === "none" ? (
          <>
            <strong className="font-bold">ปกติทีมคุณไม่เห็นเมนูนี้</strong> — แสดงให้ดูเพราะเป็นโหมด demo {forOwner}
          </>
        ) : (
          <>
            <strong className="font-bold">อ่านอย่างเดียว</strong> — {forOwner} จึงแก้ไขจากหน้านี้ไม่ได้
          </>
        )}
      </span>
    </div>
  );
}
