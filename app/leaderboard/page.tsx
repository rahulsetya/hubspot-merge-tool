"use client";

import { useMemo, useState } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Activity,
  History,
  Sparkles,
  Flame,
  Award,
  Target,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  LEADERBOARD,
  initialsOf,
  rankFor,
  totalsFor,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/lib/leaderboard";

const BADGE_STYLES: Record<NonNullable<LeaderboardEntry["badge"]>, string> = {
  "Top streak": "bg-amber-50 text-amber-700 ring-amber-200",
  "First merger": "bg-slate-100 text-slate-600 ring-slate-200",
  "Data hawk": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "New this month": "bg-violet-50 text-violet-700 ring-violet-200",
};

const BADGE_ICON: Record<NonNullable<LeaderboardEntry["badge"]>, React.ElementType> = {
  "Top streak": Flame,
  "First merger": Sparkles,
  "Data hawk": Target,
  "New this month": Award,
};

export default function LeaderboardPage() {
  const { audit, loaded } = useStore();
  const [period, setPeriod] = useState<LeaderboardPeriod>("last30");

  const ranked = useMemo(() => rankFor(period), [period]);
  const totals = useMemo(() => totalsFor(period), [period]);
  const periodKey = period === "last30" ? "mergesLast30" : "mergesAllTime";

  // "You" is the current demo session's signed-in user. Live merges in this
  // browser session count toward your spot on the board.
  const yourMerges = audit.length;
  const yourRecordsRemoved = audit.reduce(
    (s, e) => s + e.mergedCompanyIds.length,
    0
  );
  const yourActivities = audit.reduce(
    (s, e) => s + e.associationsCombined.activities,
    0
  );

  // Compute where "you" would slot in for the active period.
  const yourRank = useMemo(() => {
    const arr = ranked.map((e) => e[periodKey] as number);
    let r = 1;
    for (const n of arr) if (n > yourMerges) r += 1;
    return r;
  }, [ranked, periodKey, yourMerges]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Leaderboard
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            Top contributors to portal cleanup. Names, teams, and counts on
            this page are fabricated for the demo.
          </p>
        </div>
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          <PeriodButton
            active={period === "last30"}
            onClick={() => setPeriod("last30")}
            label="Last 30 days"
          />
          <PeriodButton
            active={period === "allTime"}
            onClick={() => setPeriod("allTime")}
            label="All time"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SmallStat
          label={
            period === "last30"
              ? "Merges (30 days)"
              : "Merges (all time)"
          }
          value={totals.totalMerges.toLocaleString()}
          icon={Trophy}
        />
        <SmallStat
          label="Records removed"
          value={totals.totalRecordsRemoved.toLocaleString()}
          icon={History}
        />
        <SmallStat
          label="Activities preserved"
          value={totals.totalActivities.toLocaleString()}
          icon={Activity}
        />
        <SmallStat
          label="Active contributors"
          value={LEADERBOARD.length}
          icon={Sparkles}
        />
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {top3.map((entry, i) => {
          const merges = entry[periodKey] as number;
          return <PodiumCard key={entry.id} entry={entry} place={i + 1} merges={merges} />;
        })}
      </div>

      {/* Full ranked table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Full ranking
          </h2>
          <span className="text-[11px] text-slate-500">
            {period === "last30" ? "Last 30 days" : "All time"} ·{" "}
            {ranked.length} contributors
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left font-medium px-5 py-2.5 w-12">#</th>
                <th className="text-left font-medium px-3 py-2.5">User</th>
                <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">
                  Team
                </th>
                <th className="text-right font-medium px-3 py-2.5">Merges</th>
                <th className="text-right font-medium px-3 py-2.5 hidden lg:table-cell">
                  Records removed
                </th>
                <th className="text-right font-medium px-3 py-2.5 hidden lg:table-cell">
                  Activities preserved
                </th>
                <th className="text-right font-medium px-5 py-2.5 hidden md:table-cell">
                  Last merge
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rest.map((entry, i) => {
                const rank = i + 4;
                const merges = entry[periodKey] as number;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-slate-500 tabular-nums">
                      {rank}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={entry.name}
                          tone={entry.avatarTone}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <span className="truncate">{entry.name}</span>
                            {entry.badge && <Badge label={entry.badge} />}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {entry.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 hidden md:table-cell">
                      {entry.team}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {merges.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 tabular-nums hidden lg:table-cell">
                      {entry.recordsRemoved.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 tabular-nums hidden lg:table-cell">
                      {entry.activitiesPreserved.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-slate-500 hidden md:table-cell">
                      {entry.lastMergeDaysAgo === 0
                        ? "Today"
                        : `${entry.lastMergeDaysAgo}d ago`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* "You" callout */}
      {loaded && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-dark)] flex items-center justify-center font-semibold text-sm">
              YOU
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                Your demo session
              </div>
              <div className="text-[11px] text-slate-500">
                demo.user@company.com — merges done in this browser session
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right">
              <Stat label="Merges" value={yourMerges} />
              <Stat label="Records removed" value={yourRecordsRemoved} />
              <Stat
                label="Activities preserved"
                value={yourActivities.toLocaleString()}
              />
            </div>
            <div className="pl-6 border-l border-slate-200 text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                Rank
              </div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                {yourMerges === 0 ? "—" : `#${yourRank}`}
              </div>
              <div className="text-[10px] text-slate-500">
                {period === "last30" ? "last 30 days" : "all time"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PeriodButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
        active
          ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function SmallStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  merges,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  merges: number;
}) {
  const styles = {
    1: {
      ring: "ring-2 ring-amber-300",
      chip: "bg-amber-100 text-amber-800",
      icon: Crown,
      iconColor: "text-amber-500",
      label: "1st",
    },
    2: {
      ring: "ring-1 ring-slate-300",
      chip: "bg-slate-100 text-slate-700",
      icon: Medal,
      iconColor: "text-slate-400",
      label: "2nd",
    },
    3: {
      ring: "ring-1 ring-orange-200",
      chip: "bg-orange-100 text-orange-800",
      icon: Medal,
      iconColor: "text-orange-400",
      label: "3rd",
    },
  } as const;
  const s = styles[place];
  const Icon = s.icon;
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 ${s.ring}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${s.chip}`}
        >
          {s.label} place
        </span>
        <Icon className={`h-5 w-5 ${s.iconColor}`} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={entry.name} tone={entry.avatarTone} size="lg" />
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
            <span className="truncate">{entry.name}</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {entry.role} · {entry.team}
          </div>
          {entry.badge && (
            <div className="mt-1.5">
              <Badge label={entry.badge} />
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <Stat label="Merges" value={merges.toLocaleString()} />
        <Stat
          label="Records"
          value={entry.recordsRemoved.toLocaleString()}
        />
        <Stat
          label="Activities"
          value={entry.activitiesPreserved.toLocaleString()}
        />
      </div>
    </div>
  );
}

function Avatar({
  name,
  tone,
  size,
}: {
  name: string;
  tone: string;
  size: "sm" | "lg";
}) {
  const dim =
    size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-[11px]";
  return (
    <div
      className={`shrink-0 rounded-lg flex items-center justify-center font-semibold ${tone} ${dim}`}
    >
      {initialsOf(name)}
    </div>
  );
}

function Badge({ label }: { label: NonNullable<LeaderboardEntry["badge"]> }) {
  const Icon = BADGE_ICON[label];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${BADGE_STYLES[label]}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900 tabular-nums leading-tight">
        {value}
      </div>
    </div>
  );
}
