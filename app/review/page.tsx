"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Users,
  Activity,
  ZapOff,
  Search,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { combinedAssociations, conflictCount } from "@/lib/diff";
import {
  confidenceLabel,
  confidenceScore,
  getMatchSignals,
} from "@/lib/match-signals";
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

type SortKey = "default" | "confidence" | "conflicts" | "activities" | "records";
type SortDir = "asc" | "desc";

function GroupTable({
  groups,
  completedGroupIds,
  tab,
}: {
  groups: MergeGroup[];
  completedGroupIds: Set<string>;
  tab: Tab;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Decorate every group with computed metrics for sorting/filtering.
  const decorated = useMemo(
    () =>
      groups.map((g) => {
        const signals = getMatchSignals(g);
        const score = confidenceScore(signals);
        const conflicts = conflictCount(g.companies);
        const combined = combinedAssociations(g.companies);
        const owners = Array.from(
          new Set(
            g.companies
              .map((c) => c.properties.company_owner)
              .filter((v): v is string => !!v)
          )
        );
        return { group: g, signals, score, conflicts, combined, owners };
      }),
    [groups]
  );

  // Owner pool for the filter dropdown.
  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    decorated.forEach((d) => d.owners.forEach((o) => set.add(o)));
    return Array.from(set).sort();
  }, [decorated]);

  // Apply filter, then sort.
  const visible = useMemo(() => {
    let rows = decorated;
    if (ownerFilter !== "all") {
      rows = rows.filter((d) => d.owners.includes(ownerFilter));
    }
    if (sortKey !== "default") {
      const dirMul = sortDir === "asc" ? 1 : -1;
      const sorted = [...rows].sort((a, b) => {
        let av = 0;
        let bv = 0;
        if (sortKey === "confidence") {
          av = a.score;
          bv = b.score;
        } else if (sortKey === "conflicts") {
          av = a.conflicts;
          bv = b.conflicts;
        } else if (sortKey === "activities") {
          av = a.combined.activities;
          bv = b.combined.activities;
        } else if (sortKey === "records") {
          av = a.group.companies.length;
          bv = b.group.companies.length;
        }
        return (av - bv) * dirMul;
      });
      rows = sorted;
    }
    return rows;
  }, [decorated, ownerFilter, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      // Toggle direction; cycle to default after asc.
      if (sortDir === "desc") setSortDir("asc");
      else {
        setSortKey("default");
        setSortDir("desc");
      }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key)
      return <ChevronDown className="h-3 w-3 text-slate-300" />;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 text-[var(--brand)]" />
    ) : (
      <ChevronUp className="h-3 w-3 text-[var(--brand)]" />
    );
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Filter by owner
          </label>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm bg-white border border-slate-300 rounded-md px-2.5 py-1.5 hover:border-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All owners</option>
            {ownerOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {(ownerFilter !== "all" || sortKey !== "default") && (
            <button
              onClick={() => {
                setOwnerFilter("all");
                setSortKey("default");
                setSortDir("desc");
              }}
              className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              Reset
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          Showing {visible.length} of {decorated.length} group
          {decorated.length === 1 ? "" : "s"}
        </div>
      </div>

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
              <SortableHeader
                label="Confidence"
                active={sortKey === "confidence"}
                indicator={sortIndicator("confidence")}
                onClick={() => onSort("confidence")}
              />
              <SortableHeader
                label="Records"
                active={sortKey === "records"}
                indicator={sortIndicator("records")}
                onClick={() => onSort("records")}
              />
              <SortableHeader
                label="Conflicts"
                active={sortKey === "conflicts"}
                indicator={sortIndicator("conflicts")}
                onClick={() => onSort("conflicts")}
              />
              <SortableHeader
                label="Activities"
                active={sortKey === "activities"}
                indicator={sortIndicator("activities")}
                onClick={() => onSort("activities")}
              />
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No groups match the current filter.
                </td>
              </tr>
            )}
            {visible.map(
              ({ group, signals, score, conflicts, combined }, idx) => {
            const isDone = completedGroupIds.has(group.id);
            const tone = confidenceLabel(score);
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
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums px-2 py-0.5 rounded ring-1 ${tone.color}`}
                    title={`${signals.length} signal${
                      signals.length === 1 ? "" : "s"
                    } matched`}
                  >
                    {(score * 100).toFixed(0)}%
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {signals.length} signal{signals.length === 1 ? "" : "s"}
                  </div>
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
              }
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SortableHeader({
  label,
  active,
  indicator,
  onClick,
}: {
  label: string;
  active: boolean;
  indicator: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${
          active ? "text-[var(--brand-dark)]" : ""
        }`}
      >
        {label}
        {indicator}
      </button>
    </th>
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
