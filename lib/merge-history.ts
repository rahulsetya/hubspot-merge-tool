// Synthesizes a 13-week merge history so the audit page can show a
// "merges-per-week" trend even on a fresh demo. Live merges from the
// audit log are blended into the most recent week.

import type { AuditEntry } from "./types";

export type WeeklyMergeBucket = {
  /** Weeks from the most recent (0 = current week). */
  weeksAgo: number;
  /** ISO date for the start (Monday) of that week. */
  weekStart: string;
  historical: number;
  liveSession: number;
  total: number;
};

/** Deterministic 13-week curve, ramping up like adoption is taking hold. */
const HISTORICAL_WEEKLY: number[] = [
  // 12 weeks ago → 1 week ago (most recent first reading is index 12)
  4, 6, 5, 8, 12, 14, 17, 22, 19, 25, 28, 31, 26,
];

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = (out.getUTCDay() + 6) % 7; // Monday-first
  out.setUTCDate(out.getUTCDate() - day);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export function weeklyMergeHistory(audit: AuditEntry[]): WeeklyMergeBucket[] {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const buckets: WeeklyMergeBucket[] = [];

  // Build oldest → newest so weeksAgo decreases.
  for (let i = HISTORICAL_WEEKLY.length - 1; i >= 0; i--) {
    const weeksAgo = i;
    const weekStart = new Date(thisWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7 * weeksAgo);
    const historical = HISTORICAL_WEEKLY[HISTORICAL_WEEKLY.length - 1 - i];
    const liveSession = countLiveInWeek(audit, weekStart);
    buckets.push({
      weeksAgo,
      weekStart: weekStart.toISOString(),
      historical,
      liveSession,
      total: historical + liveSession,
    });
  }

  return buckets;
}

function countLiveInWeek(audit: AuditEntry[], weekStart: Date): number {
  const start = weekStart.getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  return audit.filter((e) => {
    const t = Date.parse(e.mergedAt);
    return t >= start && t < end;
  }).length;
}

export function totalMerges90d(audit: AuditEntry[]): number {
  return weeklyMergeHistory(audit).reduce((s, b) => s + b.total, 0);
}
