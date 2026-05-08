"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  Layers,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  COMPONENT_DESCRIPTIONS,
  COMPONENT_LABELS,
  COMPONENT_WEIGHTS,
  computeHealth,
  weeklyHealthHistory,
  type HealthBreakdown,
} from "@/lib/health";

const COMPONENT_ICON: Record<keyof HealthBreakdown, React.ElementType> = {
  dedup: Layers,
  owner: Users,
  tier: Sparkles,
  lifecycle: Heart,
  recency: Activity,
};

export default function HealthPage() {
  const { audit, loaded } = useStore();
  const snapshot = useMemo(
    () => computeHealth(audit.length),
    [audit.length]
  );
  const history = useMemo(
    () => weeklyHealthHistory(snapshot.score),
    [snapshot.score]
  );
  const trendDelta = history[history.length - 1].score - history[0].score;

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="mb-6">
        <div className="text-xs font-medium text-[var(--brand-dark)] uppercase tracking-wider mb-1">
          Portal Health
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          CRM hygiene, at a glance
        </h1>
        <p className="mt-1 text-slate-600 text-sm max-w-2xl">
          One number that captures how clean the portal is — plus the
          components that make up the score and a 12-week trend. The score
          updates as you merge groups in this session.
        </p>
      </div>

      {/* Hero score card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-start">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Portal health score
            </div>
            <div className="flex items-end gap-3">
              <ScoreRing score={snapshot.score} />
              <div>
                <span
                  className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ring-1 ${snapshot.gradeTone}`}
                >
                  Grade {snapshot.grade}
                </span>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{trendDelta} pts vs 12w ago
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 leading-relaxed">
              Composed of dedup health, owner coverage, tier coverage,
              lifecycle coverage, and 90-day activity recency. Weighted for
              executive-level KPIs.
            </div>
          </div>

          {/* Sparkline */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700">
                Last 12 weeks
              </h2>
              <span className="text-[11px] text-slate-500">
                {history[0].score} → {history[history.length - 1].score}
              </span>
            </div>
            <Sparkline points={history.map((p) => p.score)} />
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
              <span>12w ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {(Object.keys(COMPONENT_LABELS) as (keyof HealthBreakdown)[]).map(
          (key) => {
            const Icon = COMPONENT_ICON[key];
            const value = snapshot.breakdown[key];
            const weight = COMPONENT_WEIGHTS[key];
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {COMPONENT_LABELS[key]}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {value}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <ProgressBar value={value} />
                <div className="mt-2 text-[10px] text-slate-500">
                  Weight {(weight * 100).toFixed(0)}%
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Detail rows */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            What goes into the score
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {(Object.keys(COMPONENT_LABELS) as (keyof HealthBreakdown)[]).map(
            (key) => {
              const Icon = COMPONENT_ICON[key];
              const value = snapshot.breakdown[key];
              return (
                <li
                  key={key}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">
                      {COMPONENT_LABELS[key]}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {COMPONENT_DESCRIPTIONS[key]}
                    </p>
                  </div>
                  <div className="text-right shrink-0 w-32">
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {value}
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <ProgressBar value={value} small />
                  </div>
                </li>
              );
            }
          )}
        </ul>
      </div>

      {/* CTA */}
      {loaded && (
        <div className="flex items-center justify-between bg-slate-900 text-slate-100 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-white">
                {snapshot.duplicatesRemaining.toLocaleString()} duplicate
                records still affecting your score
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Each merge in this session bumps the dedup component upward.
                Clearing the queue closes the gap to A-grade.
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
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = pct * c;
  const tone =
    score >= 85
      ? "stroke-emerald-500"
      : score >= 75
      ? "stroke-lime-500"
      : score >= 65
      ? "stroke-amber-500"
      : score >= 50
      ? "stroke-orange-500"
      : "stroke-rose-500";
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-slate-100"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-slate-900 tabular-nums leading-none">
          {score}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
          / 100
        </span>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  small = false,
}: {
  value: number;
  small?: boolean;
}) {
  const tone =
    value >= 85
      ? "bg-emerald-500"
      : value >= 75
      ? "bg-lime-500"
      : value >= 65
      ? "bg-amber-500"
      : value >= 50
      ? "bg-orange-500"
      : "bg-rose-500";
  return (
    <div
      className={`mt-2 ${
        small ? "h-1" : "h-1.5"
      } rounded-full bg-slate-100 overflow-hidden`}
    >
      <div
        className={`h-full ${tone} transition-all`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return null;
  const w = 800;
  const h = 110;
  const padX = 4;
  const padY = 8;
  const min = Math.min(...points) - 4;
  const max = Math.max(...points) + 4;
  const span = Math.max(1, max - min);
  const xs = points.map(
    (_, i) => padX + (i * (w - 2 * padX)) / (points.length - 1)
  );
  const ys = points.map(
    (v) => padY + (1 - (v - min) / span) * (h - 2 * padY)
  );
  const pathD = points
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${xs[xs.length - 1].toFixed(1)} ${h - padY} L ${
    xs[0]
  } ${h - padY} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-28"
    >
      <defs>
        <linearGradient id="health-sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(34 197 94 / 0.18)" />
          <stop offset="100%" stopColor="rgb(34 197 94 / 0)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#health-sparkfill)" />
      <path
        d={pathD}
        fill="none"
        stroke="rgb(16 185 129)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* end marker */}
      <circle
        cx={xs[xs.length - 1]}
        cy={ys[ys.length - 1]}
        r="3.5"
        className="fill-emerald-500 stroke-white"
        strokeWidth="2"
      />
    </svg>
  );
}
