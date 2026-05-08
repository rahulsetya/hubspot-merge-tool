// Portal Health Score: a single 0–100 grade for CRM hygiene, with a
// composition breakdown and a 12-week trend.
//
// The score is composed of:
//   * Dedup health  — fewer outstanding duplicates is better. Improves as
//     audit entries accumulate in the demo session.
//   * Owner coverage — % of records with a company_owner.
//   * Tier coverage — % of records with platform_engagement_tier.
//   * Lifecycle coverage — % of records with a lifecyclestage.
//   * Activity recency — % of records modified in the last 90 days.
//
// Coverage figures are derived once from the seeded portal snapshot so the
// breakdown is stable and the trend feels grounded.

import {
  PORTAL_DUPLICATES_TO_MERGE,
  PORTAL_TOTAL_COMPANIES,
  PORTAL_UNIQUE_AFTER_MERGE,
  SEED_GROUPS,
} from "./seed-data";

export type HealthBreakdown = {
  dedup: number; // 0..100
  owner: number;
  tier: number;
  lifecycle: number;
  recency: number;
};

export type HealthSnapshot = {
  score: number; // 0..100, integer
  grade: string; // "A+" .. "F"
  gradeTone: string; // tailwind classes for the grade chip
  trendDelta: number; // points vs first historical point
  breakdown: HealthBreakdown;
  weights: HealthBreakdown;
  duplicatesRemaining: number;
  totalCompanies: number;
};

export const COMPONENT_WEIGHTS: HealthBreakdown = {
  dedup: 0.4,
  owner: 0.2,
  tier: 0.2,
  lifecycle: 0.1,
  recency: 0.1,
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Coverage stats computed once from the seeded portal snapshot. */
function coverageFromSeed(): {
  owner: number;
  tier: number;
  lifecycle: number;
  recency: number;
} {
  const companies = SEED_GROUPS.flatMap((g) => g.companies);
  if (companies.length === 0) {
    return { owner: 0, tier: 0, lifecycle: 0, recency: 0 };
  }
  const total = companies.length;
  const ownerCount = companies.filter(
    (c) => !!c.properties.company_owner
  ).length;
  const tierCount = companies.filter(
    (c) => !!c.properties.platform_engagement_tier
  ).length;
  const lifecycleCount = companies.filter(
    (c) =>
      !!c.properties.lifecyclestage &&
      c.properties.lifecyclestage !== "other"
  ).length;
  // Treat anything modified inside the seed window as "recent" — pick the
  // most recent modified date as "now" so the demo doesn't drift over time.
  const modTimes = companies
    .map((c) => Date.parse(c.properties.hs_lastmodifieddate))
    .filter((n) => !Number.isNaN(n));
  const now = Math.max(...modTimes);
  const recencyCount = companies.filter((c) => {
    const t = Date.parse(c.properties.hs_lastmodifieddate);
    return !Number.isNaN(t) && now - t <= NINETY_DAYS_MS;
  }).length;
  return {
    owner: Math.round((ownerCount / total) * 100),
    tier: Math.round((tierCount / total) * 100),
    lifecycle: Math.round((lifecycleCount / total) * 100),
    recency: Math.round((recencyCount / total) * 100),
  };
}

export const SEEDED_COVERAGE = coverageFromSeed();

/** Average duplicates resolved per merge action, used to scale audit progress. */
const DUPLICATES_PER_MERGE = Math.max(
  1,
  Math.round(PORTAL_DUPLICATES_TO_MERGE / Math.max(SEED_GROUPS.length, 1))
);

export function computeHealth(audited: number): HealthSnapshot {
  const resolved = Math.min(
    PORTAL_DUPLICATES_TO_MERGE,
    Math.max(0, audited) * DUPLICATES_PER_MERGE
  );
  const duplicatesRemaining = PORTAL_DUPLICATES_TO_MERGE - resolved;
  const cleanRecords = PORTAL_TOTAL_COMPANIES - duplicatesRemaining;
  const dedup = Math.round((cleanRecords / PORTAL_TOTAL_COMPANIES) * 100);

  const breakdown: HealthBreakdown = {
    dedup,
    owner: SEEDED_COVERAGE.owner,
    tier: SEEDED_COVERAGE.tier,
    lifecycle: SEEDED_COVERAGE.lifecycle,
    recency: SEEDED_COVERAGE.recency,
  };

  const score = Math.round(
    breakdown.dedup * COMPONENT_WEIGHTS.dedup +
      breakdown.owner * COMPONENT_WEIGHTS.owner +
      breakdown.tier * COMPONENT_WEIGHTS.tier +
      breakdown.lifecycle * COMPONENT_WEIGHTS.lifecycle +
      breakdown.recency * COMPONENT_WEIGHTS.recency
  );

  const grade = gradeFor(score);
  const gradeTone = gradeTone_(score);

  // Trend is computed in `weeklyHealthHistory` against this snapshot's
  // composition; the delta here is filled in by the page using the history.
  return {
    score,
    grade,
    gradeTone,
    trendDelta: 0,
    breakdown,
    weights: COMPONENT_WEIGHTS,
    duplicatesRemaining,
    totalCompanies: PORTAL_TOTAL_COMPANIES,
  };
}

export function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 45) return "D";
  return "F";
}

function gradeTone_(score: number): string {
  if (score >= 85) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 75) return "bg-lime-50 text-lime-700 ring-lime-200";
  if (score >= 65) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (score >= 50) return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

export type HealthHistoryPoint = {
  weeksAgo: number;
  score: number;
};

/**
 * Synthetic 12-week history. The series ends at the current `nowScore` and
 * trends upward to imply ongoing cleanup. Deterministic for visual stability.
 */
export function weeklyHealthHistory(nowScore: number, weeks = 12): HealthHistoryPoint[] {
  const start = Math.max(40, nowScore - 18);
  const end = nowScore;
  const out: HealthHistoryPoint[] = [];
  for (let i = 0; i < weeks; i++) {
    const t = i / (weeks - 1);
    // ease-in-out so cleanup looks like adoption
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    // small deterministic wobble keeps the line from feeling fake-perfect
    const wobble = ((i * 37) % 5) - 2;
    out.push({
      weeksAgo: weeks - 1 - i,
      score: Math.round(start + (end - start) * eased + wobble),
    });
  }
  // ensure last point lines up exactly with current
  out[out.length - 1].score = end;
  return out;
}

export const COMPONENT_LABELS: Record<keyof HealthBreakdown, string> = {
  dedup: "Dedup health",
  owner: "Owner coverage",
  tier: "Tier coverage",
  lifecycle: "Lifecycle coverage",
  recency: "Activity recency (90d)",
};

export const COMPONENT_DESCRIPTIONS: Record<keyof HealthBreakdown, string> = {
  dedup:
    "Share of company records that are unique (not part of an unresolved duplicate group).",
  owner: "Share of company records with a company_owner assigned.",
  tier: "Share of company records with a platform engagement tier set.",
  lifecycle: "Share of company records with a lifecycle stage set.",
  recency: "Share of company records modified in the last 90 days.",
};

/** Companions used by the dashboard summary card. */
export const PORTAL_TOTAL_FOR_HEALTH = PORTAL_TOTAL_COMPANIES;
export const PORTAL_UNIQUE_FOR_HEALTH = PORTAL_UNIQUE_AFTER_MERGE;
