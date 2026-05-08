"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  IdCard,
  MapPin,
  Radar,
  ShieldCheck,
  Type,
  UserCheck,
  Users,
  Zap,
  Database,
  GitBranch,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  confidenceLabel,
  confidenceScore,
  getMatchSignals,
} from "@/lib/match-signals";
import { sourceBreakdown } from "@/lib/sources";

type Rule = {
  type:
    | "platform-id"
    | "domain"
    | "name-similarity"
    | "address"
    | "ir-contact"
    | "company-owner";
  label: string;
  description: string;
  icon: React.ElementType;
  threshold?: string;
  weight: number;
  active: boolean;
  tier: "primary" | "secondary";
};

const RULES: Rule[] = [
  {
    type: "platform-id",
    label: "Platform CompanyID collision",
    description:
      "Multiple HubSpot companies share the same Platform CompanyID. Sync-breaking — always flagged.",
    icon: IdCard,
    threshold: "Exact match",
    weight: 0.45,
    active: true,
    tier: "primary",
  },
  {
    type: "domain",
    label: "Domain match",
    description:
      "Records share the same website root domain (subdomain or path may differ).",
    icon: Globe,
    threshold: "Root domain equal",
    weight: 0.2,
    active: true,
    tier: "primary",
  },
  {
    type: "name-similarity",
    label: "Company name similarity",
    description:
      "Levenshtein distance on normalized names (strips Inc, LLC, punctuation).",
    icon: Type,
    threshold: "≥ 60% similar",
    weight: 0.2,
    active: true,
    tier: "primary",
  },
  {
    type: "address",
    label: "Address match",
    description:
      "Same postal code; bonus if street address also matches after normalization.",
    icon: MapPin,
    threshold: "Postal code equal",
    weight: 0.15,
    active: true,
    tier: "secondary",
  },
  {
    type: "ir-contact",
    label: "IR contact owner overlap",
    description:
      "Same IR contact owner across multiple records (excluding 'No owner').",
    icon: UserCheck,
    threshold: "Exact match",
    weight: 0.1,
    active: true,
    tier: "secondary",
  },
  {
    type: "company-owner",
    label: "Company owner overlap",
    description: "Same HubSpot owner across multiple records.",
    icon: Users,
    threshold: "Exact match",
    weight: 0.05,
    active: true,
    tier: "secondary",
  },
];

const RECENT_RUNS = [
  { date: "2026-04-29 02:00 UTC", scanned: 650, found: 26, newGroups: 2 },
  { date: "2026-04-28 02:00 UTC", scanned: 648, found: 24, newGroups: 1 },
  { date: "2026-04-27 02:00 UTC", scanned: 647, found: 23, newGroups: 0 },
  { date: "2026-04-26 02:00 UTC", scanned: 644, found: 23, newGroups: 3 },
  { date: "2026-04-25 02:00 UTC", scanned: 641, found: 20, newGroups: 0 },
];

export default function DetectionPage() {
  const { groups, platformIdGroups, nameMatchGroups } = useStore();

  // Quick stats for the dashboard cards
  const highConfidence = groups.filter(
    (g) => confidenceScore(getMatchSignals(g)) >= 0.85
  ).length;
  const avgConfidence =
    groups.length === 0
      ? 0
      : groups.reduce(
          (s, g) => s + confidenceScore(getMatchSignals(g)),
          0
        ) / groups.length;

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-6">
        <div className="text-xs font-medium text-[var(--brand-dark)] uppercase tracking-wider mb-1">
          Detection
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Duplicate detection rules &amp; schedule
        </h1>
        <p className="mt-1 text-slate-600 text-sm max-w-2xl">
          Multi-signal detection runs nightly, catches new collisions before
          they break sync, and posts to Slack so the team can act before
          downstream tooling falls out of sync.
        </p>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SmallStat
          icon={Database}
          label="Records scanned"
          value="650"
          sublabel="last run"
        />
        <SmallStat
          icon={Radar}
          label="Detection rules"
          value={`${RULES.filter((r) => r.active).length} of ${RULES.length}`}
          sublabel="active"
        />
        <SmallStat
          icon={ShieldCheck}
          label="High-confidence groups"
          value={highConfidence}
          sublabel={`${(avgConfidence * 100).toFixed(0)}% avg confidence`}
        />
        <SmallStat
          icon={Clock}
          label="Next scan"
          value="in 18h"
          sublabel="Daily · 02:00 UTC"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Active rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each match contributes to a per-group confidence score. Higher
                weight rules dominate the score.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {RULES.map((r) => {
              const Icon = r.icon;
              return (
                <li
                  key={r.type}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ${
                      r.tier === "primary"
                        ? "bg-[var(--brand-soft)] ring-orange-200 text-[var(--brand-dark)]"
                        : "bg-slate-50 ring-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">
                        {r.label}
                      </span>
                      {r.tier === "primary" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-soft)] text-[var(--brand-dark)] ring-1 ring-orange-200 px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                      {r.threshold && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {r.threshold}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="uppercase tracking-wider font-semibold">
                          Weight
                        </span>
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--brand)]"
                            style={{ width: `${r.weight * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums">
                          {(r.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch active={r.active} />
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Demo prototype — toggles are read-only. Production would persist
            rule state and re-run detection on save.
          </div>
        </div>

        {/* Slack alerts mock + Schedule */}
        <div className="space-y-6">
          {/* Slack alert preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Slack alerts</h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                <Check className="h-3 w-3" />
                On
              </span>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-600 mb-3">
                Posts to{" "}
                <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                  #data-quality
                </code>{" "}
                when detection finds new collisions.
              </div>

              {/* Faux Slack message */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-[var(--brand)] flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-sm">
                        MergeOps
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded uppercase">
                        APP
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">
                        2:00 AM
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-800 font-medium">
                      🚨 2 new Platform CompanyID collisions detected
                    </div>
                    <ul className="mt-1.5 text-xs text-slate-600 space-y-0.5">
                      <li>
                        • <strong>Quartzlake Capital Group</strong> · 2 records ·
                        sync-breaking
                      </li>
                      <li>
                        • <strong>Glassbrook Capital</strong> · 2 records ·
                        sync-breaking
                      </li>
                    </ul>
                    <div className="mt-2 text-[11px] text-slate-500">
                      18 collisions still open. 6,579 activities at risk.
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-dark)] hover:text-[var(--brand)] border border-orange-200 bg-[var(--brand-soft)] px-2.5 py-1 rounded"
                    >
                      Review now →
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                Channel, threshold, and quiet hours all configurable. Mentions
                the surviving record&apos;s owner on Tier-1 collisions.
              </div>
            </div>
          </div>

          {/* Recent runs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Recent runs</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {RECENT_RUNS.map((run, i) => (
                <li
                  key={run.date}
                  className="px-5 py-3 flex items-center gap-3 text-xs"
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      i === 0 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 font-medium tabular-nums">
                      {run.date}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {run.scanned.toLocaleString()} scanned ·{" "}
                      {run.found} groups
                    </div>
                  </div>
                  {run.newGroups > 0 ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 ring-1 ring-rose-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      +{run.newGroups} new
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      No change
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Source attribution */}
      <SourceAttribution />

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between bg-slate-900 text-slate-100 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <Radar className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <div className="font-semibold text-white">
              {platformIdGroups.length + nameMatchGroups.length} groups in queue
              from the last scan
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Review them now to clear sync collisions before the next scan
              picks up new ones.
            </div>
          </div>
        </div>
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-colors"
        >
          Open review queue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SourceAttribution() {
  const buckets = sourceBreakdown();
  const total = buckets.reduce((s, b) => s + b.companies, 0);
  const max = Math.max(1, ...buckets.map((b) => b.companies));
  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">
            Where do duplicates come from?
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">
          {total} duplicate records across {buckets.length} sources
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Bar chart */}
        <div className="lg:col-span-2 p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
          <ul className="space-y-3">
            {buckets.map((b) => {
              const widthPct = (b.companies / max) * 100;
              return (
                <li key={b.source.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${b.source.tone}`}
                      >
                        {b.source.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                      {b.companies}{" "}
                      <span className="text-slate-400 font-normal">
                        records · {b.groups} groups
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${b.source.bar}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                    {b.source.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Top offender callout */}
        <div className="p-5 bg-slate-50 flex flex-col">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Top offender
          </div>
          {buckets[0] && (
            <>
              <div className="text-lg font-semibold text-slate-900 leading-tight">
                {buckets[0].source.label}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {buckets[0].percentOfDuplicates.toFixed(0)}% of all duplicate
                records originated here.
              </div>
              <div className="mt-4 text-xs text-slate-600 leading-relaxed">
                Fixing the upstream pipe is higher leverage than cleaning each
                duplicate individually. Consider tightening de-dupe checks at
                the form / sync entry point.
              </div>
              <div className="mt-auto pt-4 text-[11px] text-slate-500">
                Attribution is computed from a deterministic tag on each
                record — for the demo only. Production would read it from a
                <code className="mx-1 text-[10px] bg-white px-1 py-0.5 rounded font-mono ring-1 ring-slate-200">
                  hs_analytics_source
                </code>
                style property.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-xl font-semibold text-slate-900 tabular-nums leading-tight">
          {value}
        </div>
        {sublabel && (
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${
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
    </div>
  );
}
