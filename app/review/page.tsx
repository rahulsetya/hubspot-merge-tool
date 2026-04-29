"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitMerge,
  Users,
  Activity,
  ZapOff,
  Search,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { combinedAssociations, conflictCount } from "@/lib/diff";
import type { MergeGroup } from "@/lib/types";

type Tab = "platform" | "name";

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={<div className="px-8 py-8 text-slate-500">Loading…</div>}
    >
      <ReviewQueueInner />
    </Suspense>
  );
}

function ReviewQueueInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = tabParam === "name" ? "name" : "platform";

  const { platformIdGroups, nameMatchGroups, completedGroupIds } = useStore();

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/review?${params.toString()}`, { scroll: false });
  };

  const groups = tab === "platform" ? platformIdGroups : nameMatchGroups;
  const tabMeta = useMemo(
    () =>
      tab === "platform"
        ? {
            title: "Platform CompanyID collisions",
            blurb:
              "Multiple companies share the same Platform CompanyID — only one of them syncs to our internal tooling. Resolving these is the urgent path.",
            icon: ZapOff,
            accent: "rose" as const,
          }
        : {
            title: "Name match candidates",
            blurb:
              "Same or similar company name with different or missing Platform CompanyID. Lower urgency, but causes orphaned records and fragmented activity.",
            icon: Search,
            accent: "amber" as const,
          },
    [tab]
  );

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Review queue
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Two distinct duplicate types — review and resolve each.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-end border-b border-slate-200 mb-5">
        <TabButton
          active={tab === "platform"}
          onClick={() => setTab("platform")}
          accent="rose"
          icon={ZapOff}
          label="Platform CompanyID collisions"
          count={platformIdGroups.length}
          badge="Sync-breaking"
        />
        <TabButton
          active={tab === "name"}
          onClick={() => setTab("name")}
          accent="amber"
          icon={Search}
          label="Name match candidates"
          count={nameMatchGroups.length}
          badge="Data quality"
        />
      </div>

      {/* Tab description */}
      <div
        className={`flex items-start gap-3 mb-5 p-4 rounded-lg border ${
          tabMeta.accent === "rose"
            ? "bg-rose-50/50 border-rose-200"
            : "bg-amber-50/50 border-amber-200"
        }`}
      >
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            tabMeta.accent === "rose"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <tabMeta.icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-900">{tabMeta.title}</div>
          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
            {tabMeta.blurb}
          </p>
        </div>
      </div>

      <GroupTable
        groups={groups}
        completedGroupIds={completedGroupIds}
        tab={tab}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  accent,
  icon: Icon,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  accent: "rose" | "amber";
  icon: React.ElementType;
  label: string;
  count: number;
  badge: string;
}) {
  const accentText = accent === "rose" ? "text-rose-700" : "text-amber-700";
  const accentBg = accent === "rose" ? "bg-rose-500" : "bg-amber-500";
  const accentBorder =
    accent === "rose" ? "border-rose-500" : "border-amber-500";

  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 transition-colors ${
        active
          ? `${accentBorder} ${accentText}`
          : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? accentText : "text-slate-400"}`} />
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
          active
            ? `${accentBg} text-white`
            : "bg-slate-200 text-slate-700 group-hover:bg-slate-300"
        }`}
      >
        {count}
      </span>
      <span
        className={`hidden xl:inline text-[10px] font-bold uppercase tracking-wider ${
          active ? accentText : "text-slate-400"
        }`}
      >
        · {badge}
      </span>
    </button>
  );
}

function GroupTable({
  groups,
  completedGroupIds,
  tab,
}: {
  groups: MergeGroup[];
  completedGroupIds: Set<string>;
  tab: Tab;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">
              #
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Company
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {tab === "platform" ? "Platform CompanyID" : "Match"}
            </th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Records
            </th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Conflicts
            </th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Activities
            </th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map((group, idx) => {
            const conflicts = conflictCount(group.companies);
            const combined = combinedAssociations(group.companies);
            const isDone = completedGroupIds.has(group.id);
            return (
              <tr
                key={group.id}
                className={`hover:bg-slate-50 transition-colors ${
                  isDone ? "bg-emerald-50/30" : ""
                }`}
              >
                <td className="px-5 py-4 text-xs text-slate-500 tabular-nums">
                  {idx + 1}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/review/${group.id}`}
                    className="font-medium text-slate-900 hover:text-[var(--brand-dark)]"
                  >
                    {group.displayName}
                  </Link>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {group.companies[0]?.properties.category ?? "—"} ·{" "}
                    {group.companies[0]?.properties.city ?? "—"}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {tab === "platform" ? (
                    <code className="text-xs bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-2 py-1 rounded font-mono">
                      {group.platformCompanyId}
                    </code>
                  ) : (
                    <NameMatchSummary group={group} />
                  )}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="tabular-nums font-medium">
                      {group.companies.length}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {conflicts > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 bg-rose-50 ring-1 ring-rose-200 px-2 py-0.5 rounded-md tabular-nums">
                      <AlertTriangle className="h-3 w-3" />
                      {conflicts}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-700 tabular-nums">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    {combined.activities.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" />
                      Merged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded-md">
                      <GitMerge className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/review/${group.id}`}
                    className="text-slate-400 hover:text-[var(--brand)]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NameMatchSummary({ group }: { group: MergeGroup }) {
  const ids = group.companies.map((c) => c.platformCompanyId).filter(Boolean);
  const missing = group.companies.length - ids.length;
  const score = group.matchScore ?? 0;
  const scoreColor =
    score >= 0.95
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 0.9
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded ring-1 ${scoreColor} w-fit`}
      >
        {(score * 100).toFixed(0)}% name match
      </span>
      <span className="text-[11px] text-slate-500">
        {ids.length === 0
          ? "No Platform CompanyID set"
          : missing > 0
          ? `${missing} missing Platform CompanyID`
          : `${new Set(ids).size} distinct IDs`}
      </span>
    </div>
  );
}
