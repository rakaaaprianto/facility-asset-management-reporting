import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ─── Button ───────────────────────────────────────────────────────── */
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 shadow-sm",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-500",
        buttonStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
        buttonStyles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────── */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white",
        className
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ─── Form Controls ─────────────────────────────────────────────────── */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-none outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-none outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-none outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-semibold text-slate-600 tracking-wide uppercase", className)}
    >
      {children}
    </label>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────── */
const badgeTones = {
  gray:   "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  green:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber:  "bg-amber-50  text-amber-700  ring-1 ring-amber-200",
  red:    "bg-red-50    text-red-700    ring-1 ring-red-200",
  blue:   "bg-brand-50  text-brand-700  ring-1 ring-brand-200",
  purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
} as const;

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        badgeTones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* ─── Table ─────────────────────────────────────────────────────────── */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {head.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({
  colSpan,
  label = "Belum ada data",
}: {
  colSpan: number;
  label?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-slate-400"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl opacity-30">📭</span>
          {label}
        </div>
      </td>
    </tr>
  );
}

/* ─── Status Badge Map ───────────────────────────────────────────────── */
export const statusTone: Record<string, keyof typeof badgeTones> = {
  DRAFT:          "gray",
  SUBMITTED:      "amber",
  APPROVED:       "green",
  NEEDS_REVISION: "red",
  PAID:           "green",
  IN_PROCESS:     "amber",
  OVERDUE:        "red",
  PENDING:        "gray",
  OPEN:           "blue",
};
