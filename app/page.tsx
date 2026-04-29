"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  GitMerge,
  Activity,
  ZapOff,
  Search,
  Plug,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  PORTAL_DUPLICATES_TO_MERGE,
  PORTAL_TOTAL_COMPANIES,
  PORTAL_UNIQUE_AFTER_MERGE,
} from "@/lib/seed-data";
import { combinedAssociations, conflictCount } from "@/lib/diff";
import { formatRelative } from "@/lib/format";

export default function DashboardPage() {
  const {
    groups,
    platformIdGroups,
    nameMatchGroups,
    pendingPlatformIdGroups,
    pendingNameMatchGroups,
    audit,
    loaded,
  } = useStore();

  const totalGroups = groups.length;
  const completedTotal =
    platformIdGroups.length +
    nameMatchGroups.length -
    pendingPlatformIdGroups.length -
    pendingNameMatchGroups.length;
  const progressPct = totalGroups
    ? Math.round((completedTotal / totalGroups) * 100)
    : 0;

  const platformPct = platformIdGroups.length
    ? Math.round(
        ((platformIdGroups.length - pendingPlatformIdGroups.length) /
          platformIdGroups.length) *
          100
      )
    : 0;
  const namePct = nameMatchGroups.length
    ? Math.round(
        ((nameMatchGroups.length - pendingNameMatchGroups.length) /
          nameMatchGroups.length) *
          100
      )
    : 0;

  const platformActivities = platformIdGroups.reduce(
    (s, g) => s + combinedAssociations(g.companies).activities,
    0
  );
  const nameActivities = nameMatchGroups.reduce(
    (s, g) => s + combinedAssociations(g.companies).activities,
    0
  );

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="text-xs font-medium text-[var(--brand-dark)] uppercase tracking-wider mb-1">
            HubSpot Data Quality
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Company Merge Operations
          </h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Resolve duplicate company records so every firm in HubSpot maps to
            one — and only one —{" "}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
              platform_company_id
            </code>
            .
          </p>
        </div>
        <Link
          href="/review"
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          Start review
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Headline portal stats */}
      <div className="bg-gradient-to-br from-[var(--brand-soft)] to-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-[var(--brand-dark)]" />
          <div className="text-xs font-semibold text-[var(--brand-dark)] uppercase tracking-wider">
            HubSpot Portal Snapshot
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-5xl font-bold text-slate-900 tabular-nums leading-none">
              {PORTAL_TOTAL_COMPANIES.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Company records today
            </div>
          </div>
          <div className="md:border-l md:border-orange-200 md:pl-6">
            <div className="text-5xl font-bold text-slate-900 tabular-nums leading-none">
              {PORTAL_UNIQUE_AFTER_MERGE.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Unique companies after merge
            </div>
          </div>
          <div className="md:border-l md:border-orange-200 md:pl-6">
            <div className="text-5xl font-bold text-[var(--brand-dark)] tabular-nums leading-none">
              {PORTAL_DUPLICATES_TO_MERGE.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Duplicates to resolve
            </div>
          </div>
        </div>
      </div>

      {/* The two duplicate types */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Two duplicate types
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Loaded for review · {totalGroups} representative groups across both
          types
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Platform CompanyID — sync breaking */}
        <div className="bg-white rounded-xl border-2 border-rose-200 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
            Sync-breaking
          </div>
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center shrink-0">
              <ZapOff className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">
                Platform CompanyID collisions
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Multiple HubSpot companies share the{" "}
                <strong>same Platform CompanyID</strong>. Our integrations can
                only sync one company per ID.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
                {platformIdGroups.length}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Collision groups
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-rose-600 tabular-nums leading-none">
                {loaded ? pendingPlatformIdGroups.length : "—"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Pending review
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
                {platformActivities.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Activities at risk
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${platformPct}%` }}
            />
          </div>
          <Link
            href="/review?tab=platform"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-700 hover:text-rose-900"
          >
            Review collisions
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Name match — data quality */}
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
            Data quality
          </div>
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">
                Name match candidates
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Same or similar company name with{" "}
                <strong>different or missing Platform CompanyID</strong>. Doesn&apos;t
                break sync, but fragments activity history and orphans records
                from our tooling.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
                {nameMatchGroups.length}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Match groups
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-amber-600 tabular-nums leading-none">
                {loaded ? pendingNameMatchGroups.length : "—"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Pending review
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums leading-none">
                {nameActivities.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Activities fragmented
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${namePct}%` }}
            />
          </div>
          <Link
            href="/review?tab=name"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900"
          >
            Review name matches
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tooling impact callout */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 mb-8 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
          <Plug className="h-5 w-5 text-orange-400" />
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          <div className="font-semibold text-white mb-1">
            Why one HubSpot company per Platform CompanyID matters
          </div>
          <p className="text-slate-300">
            Our internal tooling syncs one HubSpot company per Platform
            CompanyID. When two companies share an ID, the sync can&apos;t
            happen — leaving stale data in HubSpot.
          </p>
        </div>
      </div>

      {/* Progress + recent merges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Review progress</h3>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {progressPct}% complete
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                Pending
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                {loaded
                  ? pendingPlatformIdGroups.length +
                    pendingNameMatchGroups.length
                  : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Merged
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                {loaded ? completedTotal : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Activity className="h-3.5 w-3.5" />
                Activities preserved
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                {loaded
                  ? audit
                      .reduce(
                        (sum, e) => sum + e.associationsCombined.activities,
                        0
                      )
                      .toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
          {loaded && pendingPlatformIdGroups.length > 0 && (
            <Link
              href={`/review/${pendingPlatformIdGroups[0].id}`}
              className="mt-5 flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/30 transition-colors group"
            >
              <div>
                <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1.5">
                  <ZapOff className="h-3 w-3 text-rose-500" />
                  Up next — Platform CompanyID collision
                </div>
                <div className="font-medium text-slate-900">
                  {pendingPlatformIdGroups[0].displayName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {pendingPlatformIdGroups[0].companies.length} records ·{" "}
                  {conflictCount(pendingPlatformIdGroups[0].companies)}{" "}
                  conflicts ·{" "}
                  {combinedAssociations(
                    pendingPlatformIdGroups[0].companies
                  ).activities.toLocaleString()}{" "}
                  activities
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Recent merges</h3>
          {!loaded ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : audit.length === 0 ? (
            <div className="text-sm text-slate-500 leading-relaxed">
              No merges yet. Start the review queue to see completed merges
              appear here, with a snapshot of what was combined.
            </div>
          ) : (
            <ul className="space-y-3">
              {audit.slice(0, 5).map((entry) => {
                const group = groups.find((g) => g.id === entry.groupId);
                return (
                  <li
                    key={entry.id}
                    className="text-sm border-l-2 border-emerald-300 pl-3"
                  >
                    <div className="font-medium text-slate-900">
                      {group?.displayName ?? entry.platformCompanyId}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {entry.mergedCompanyIds.length} merged in ·{" "}
                      {entry.associationsCombined.activities.toLocaleString()}{" "}
                      activities preserved · {formatRelative(entry.mergedAt)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs text-slate-500">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Demo prototype with hypothetical data. Property schema mirrors the
          real Clear Street company fields. Numbers in the portal snapshot above
          reflect actual portal scale.
        </p>
      </div>
    </div>
  );
}
