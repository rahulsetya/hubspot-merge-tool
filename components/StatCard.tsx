import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: "brand" | "emerald" | "rose" | "violet" | "slate";
};

const ACCENT_STYLES = {
  brand: "bg-[var(--brand-soft)] text-[var(--brand-dark)]",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = "slate",
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          {label}
        </div>
        {Icon && (
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${ACCENT_STYLES[accent]}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-slate-500">{sublabel}</div>
      )}
    </div>
  );
}
