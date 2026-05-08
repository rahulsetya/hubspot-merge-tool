"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Filter,
  Play,
  ShieldAlert,
  Sliders,
  XCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  DEFAULT_POLICY,
  evaluatePolicy,
  summarizePolicy,
  type AutoMergePolicy,
} from "@/lib/policies";

const AUM_OPTIONS = [
  { label: "$10B", value: 10_000_000_000 },
  { label: "$50B", value: 50_000_000_000 },
  { label: "$100B", value: 100_000_000_000 },
  { label: "$250B", value: 250_000_000_000 },
  { label: "No limit", value: Number.POSITIVE_INFINITY },
];

export default function PoliciesPage() {
  const { pendingGroups, mergeGroup, loaded } = useStore();
  const [policy, setPolicy] = useState<AutoMergePolicy>(DEFAULT_POLICY);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ merged: number } | null>(null);

  const evaluation = useMemo(
    () => evaluatePolicy(policy, pendingGroups),
    [policy, pendingGroups]
  );
  const summary = useMemo(() => summarizePolicy(evaluation), [evaluation]);

  const updatePolicy = (patch: Partial<AutoMergePolicy>) =>
    setPolicy((p) => ({ ...p, ...patch }));

  const runPolicy = () => {
    if (running) return;
    setRunning(true);
    let merged = 0;
    for (const r of summary.matched) {
      const entry = mergeGroup(r.group.id, r.primaryCompanyId, {});
      if (entry) merged += 1;
    }
    setLastRun({ merged });
    setRunning(false);
  };

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-6">
        <div className="text-xs font-medium text-[var(--brand-dark)] uppercase tracking-wider mb-1">
          Auto-merge policies
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Set the rules. Preview the outcome. Run it.
        </h1>
        <p className="mt-1 text-slate-600 text-sm max-w-2xl">
          Define a safety threshold, see exactly which pending groups would
          auto-merge under that policy, then execute. Anything that fails a
          rule routes back to the manual review queue with a reason.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy builder */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Policy
              </h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Confidence slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Minimum confidence
                  </label>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {policy.minConfidence}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={policy.minConfidence}
                  onChange={(e) =>
                    updatePolicy({ minConfidence: Number(e.target.value) })
                  }
                  className="w-full accent-[var(--brand)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Toggle
                  label="Require Platform CompanyID match"
                  hint="Only merge when records collide on the same platform ID."
                  active={policy.requirePlatformId}
                  onChange={(v) => updatePolicy({ requirePlatformId: v })}
                />
                <Toggle
                  label="Require shared root domain"
                  hint="Records must resolve to the same website root domain."
                  active={policy.requireDomain}
                  onChange={(v) => updatePolicy({ requireDomain: v })}
                />
                <Toggle
                  label="Require shared address"
                  hint="Street address and postal code must match."
                  active={policy.requireAddress}
                  onChange={(v) => updatePolicy({ requireAddress: v })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Auto-merge AUM ceiling
                  </label>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Above goes to manual
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {AUM_OPTIONS.map((o) => {
                    const active = policy.maxAumForAuto === o.value;
                    return (
                      <button
                        key={o.label}
                        onClick={() =>
                          updatePolicy({ maxAumForAuto: o.value })
                        }
                        className={`text-[11px] font-medium px-2 py-1.5 rounded transition-colors ${
                          active
                            ? "bg-[var(--brand)] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Max property conflicts
                  </label>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {policy.maxConflicts}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={policy.maxConflicts}
                  onChange={(e) =>
                    updatePolicy({ maxConflicts: Number(e.target.value) })
                  }
                  className="w-full accent-[var(--brand)]"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Groups with more disagreeing fields than this are sent to
                  manual review for a human to break the tie.
                </p>
              </div>
            </div>
          </div>

          {/* Reset to default */}
          <button
            onClick={() => setPolicy(DEFAULT_POLICY)}
            className="w-full text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
          >
            Reset to default policy
          </button>
        </div>

        {/* Preview + run */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Policy preview
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {pendingGroups.length} pending groups
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <PreviewStat
                label="Would auto-merge"
                value={summary.matchedCount}
                tone="emerald"
                icon={CheckCircle2}
              />
              <PreviewStat
                label="Routed to manual"
                value={summary.skippedCount}
                tone="amber"
                icon={ShieldAlert}
              />
              <PreviewStat
                label="Coverage"
                value={
                  pendingGroups.length === 0
                    ? "0%"
                    : `${Math.round(
                        (summary.matchedCount / pendingGroups.length) * 100
                      )}%`
                }
                tone="slate"
                icon={Bot}
              />
            </div>

            {summary.skipReasonsRanked.length > 0 && (
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Top reasons for manual routing
                </div>
                <ul className="space-y-1.5">
                  {summary.skipReasonsRanked.slice(0, 5).map((r) => (
                    <li
                      key={r.reason}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-700 flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
                        {r.reason}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {r.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matched groups list */}
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-5 py-3 sticky top-0 bg-white z-10 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Groups matching this policy
                </div>
              </div>
              {summary.matched.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No pending groups match this policy. Loosen the rules to
                  include more.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {summary.matched.slice(0, 20).map((r) => (
                    <li
                      key={r.group.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {r.group.displayName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.group.companies.length} records ·{" "}
                          {r.confidence}% confidence · {r.conflicts} conflicts
                        </div>
                      </div>
                      <Link
                        href={`/review/${r.group.id}`}
                        className="text-[11px] text-slate-500 hover:text-slate-900 underline underline-offset-2"
                      >
                        Inspect
                      </Link>
                    </li>
                  ))}
                  {summary.matched.length > 20 && (
                    <li className="px-5 py-2 text-xs text-slate-500 text-center bg-slate-50">
                      + {summary.matched.length - 20} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Run policy */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-white">
                  {summary.matchedCount === 0
                    ? "Nothing to run"
                    : `Run policy on ${summary.matchedCount} group${
                        summary.matchedCount === 1 ? "" : "s"
                      }`}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {summary.matchedCount === 0
                    ? "Loosen rules until at least one group matches."
                    : "Each match merges the richest record into the survivor; an audit entry is recorded."}
                </div>
              </div>
              <button
                onClick={runPolicy}
                disabled={running || summary.matchedCount === 0}
                className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-colors"
              >
                <Play className="h-4 w-4" />
                {running ? "Running…" : "Run policy"}
              </button>
            </div>
            {lastRun && (
              <div className="mt-3 text-xs bg-slate-800/70 rounded-md px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Merged {lastRun.merged} group{lastRun.merged === 1 ? "" : "s"}.{" "}
                <Link
                  href="/audit"
                  className="text-orange-300 hover:text-orange-200 inline-flex items-center gap-1"
                >
                  View audit log
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {!loaded && (
            <div className="text-xs text-slate-400">Loading state…</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  active,
  onChange,
}: {
  label: string;
  hint: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className="w-full flex items-start gap-3 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
      </div>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors shrink-0 mt-0.5 ${
          active ? "bg-[var(--brand)]" : "bg-slate-300"
        }`}
        role="switch"
        aria-checked={active}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function PreviewStat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone: "emerald" | "amber" | "slate";
  icon: React.ElementType;
}) {
  const styles = {
    emerald: {
      box: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-700",
    },
    amber: {
      box: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
    slate: {
      box: "bg-slate-50",
      icon: "text-slate-600",
      value: "text-slate-900",
    },
  } as const;
  const s = styles[tone];
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div
        className={`h-9 w-9 rounded-md ${s.box} flex items-center justify-center`}
      >
        <Icon className={`h-4 w-4 ${s.icon}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </div>
        <div
          className={`text-2xl font-semibold tabular-nums leading-tight ${s.value}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
