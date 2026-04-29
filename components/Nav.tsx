"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitMerge, History, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/review", label: "Review queue", icon: GitMerge },
  { href: "/audit", label: "Audit log", icon: History },
];

export function Nav() {
  const pathname = usePathname();
  const {
    pendingPlatformIdGroups,
    pendingNameMatchGroups,
    audit,
    resetAll,
  } = useStore();
  const pendingTotal =
    pendingPlatformIdGroups.length + pendingNameMatchGroups.length;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-[var(--brand)] flex items-center justify-center shadow-sm">
            <GitMerge className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm leading-tight">
              MergeOps
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              for HubSpot
            </div>
          </div>
        </Link>
      </div>

      <nav className="px-3 py-4 flex-1">
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const badge =
              item.href === "/review"
                ? pendingTotal
                : item.href === "/audit"
                ? audit.length
                : null;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-[var(--brand)]" : "text-slate-500"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                        active
                          ? "bg-white text-[var(--brand-dark)]"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-200">
        <button
          onClick={() => {
            if (confirm("Reset demo? All merges will be cleared.")) resetAll();
          }}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md py-2 px-3 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset demo state
        </button>
        <div className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
          Demo prototype · No data leaves
          <br />
          your browser
        </div>
      </div>
    </aside>
  );
}
