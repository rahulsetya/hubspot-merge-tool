// Source attribution for duplicates: deterministically tags every seeded
// company with an upstream source (form fill, sync, manual, etc.) so the
// detection page can answer "where do duplicates keep coming from?"
//
// Tagging is a stable hash of company.id, so the breakdown is reproducible
// across page loads without persisting anything.

import { SEED_GROUPS } from "./seed-data";
import type { Company, MergeGroup } from "./types";

export type DuplicateSource = {
  id: string;
  label: string;
  description: string;
  /** Tone classes for the chip / bar fill. */
  tone: string;
  /** Bar colour (matches tone family but as a solid). */
  bar: string;
  /** Relative weight controls how often the deterministic hash picks this source. */
  weight: number;
};

export const DUPLICATE_SOURCES: DuplicateSource[] = [
  {
    id: "inbound-form",
    label: "HubSpot inbound form",
    description:
      "Marketing forms create a new company when an existing one would have matched.",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "bg-rose-500",
    weight: 28,
  },
  {
    id: "sf-sync",
    label: "Salesforce sync",
    description:
      "Salesforce → HubSpot integration creates a parallel company instead of mapping to the existing record.",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
    bar: "bg-sky-500",
    weight: 22,
  },
  {
    id: "manual",
    label: "Manual entry",
    description:
      "Reps creating a company before searching, usually with a slightly different spelling.",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "bg-amber-500",
    weight: 18,
  },
  {
    id: "event-import",
    label: "Conference / event import",
    description: "Bulk CSV uploads after events, no de-dupe key applied.",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    bar: "bg-violet-500",
    weight: 12,
  },
  {
    id: "linkedin-nav",
    label: "LinkedIn Sales Navigator",
    description:
      "Records pushed in via the LinkedIn integration, often with non-canonical company names.",
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    bar: "bg-indigo-500",
    weight: 9,
  },
  {
    id: "outreach",
    label: "Outreach.io enrichment",
    description:
      "Sequenced prospecting tools that auto-create company records during outbound campaigns.",
    tone: "bg-teal-50 text-teal-700 ring-teal-200",
    bar: "bg-teal-500",
    weight: 7,
  },
  {
    id: "partner-referral",
    label: "Partner referral",
    description: "Partner submissions through the partner portal API.",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    bar: "bg-slate-500",
    weight: 4,
  },
];

const TOTAL_WEIGHT = DUPLICATE_SOURCES.reduce((s, x) => s + x.weight, 0);

function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic source assignment for a company. */
export function sourceFor(companyId: string): DuplicateSource {
  const r = hash32(companyId) % TOTAL_WEIGHT;
  let acc = 0;
  for (const s of DUPLICATE_SOURCES) {
    acc += s.weight;
    if (r < acc) return s;
  }
  return DUPLICATE_SOURCES[DUPLICATE_SOURCES.length - 1];
}

export type SourceBucket = {
  source: DuplicateSource;
  companies: number;
  groups: number;
  percentOfDuplicates: number;
};

/**
 * Walks every duplicate group, tags each company with a source, and counts
 * how many duplicate companies originated from each source.
 *
 * "Duplicate companies" = every company in a group beyond the first (the
 * one we'd keep). This way only excess records are attributed.
 */
export function sourceBreakdown(groups: MergeGroup[] = SEED_GROUPS): SourceBucket[] {
  const groupsTouched = new Map<string, Set<string>>();
  const companiesPerSource = new Map<string, number>();
  let totalDuplicateCompanies = 0;

  for (const g of groups) {
    // skip the "primary" (first by id) — it's the survivor, not a duplicate
    const sorted = [...g.companies].sort((a, b) => a.id.localeCompare(b.id));
    const dupes = sorted.slice(1);
    for (const c of dupes) {
      const s = sourceFor(c.id);
      companiesPerSource.set(
        s.id,
        (companiesPerSource.get(s.id) ?? 0) + 1
      );
      if (!groupsTouched.has(s.id)) groupsTouched.set(s.id, new Set());
      groupsTouched.get(s.id)!.add(g.id);
      totalDuplicateCompanies += 1;
    }
  }

  const buckets: SourceBucket[] = DUPLICATE_SOURCES.map((source) => {
    const companies = companiesPerSource.get(source.id) ?? 0;
    return {
      source,
      companies,
      groups: groupsTouched.get(source.id)?.size ?? 0,
      percentOfDuplicates:
        totalDuplicateCompanies === 0
          ? 0
          : (companies / totalDuplicateCompanies) * 100,
    };
  })
    .filter((b) => b.companies > 0)
    .sort((a, b) => b.companies - a.companies);

  return buckets;
}

/** Used by the company detail / leaderboard if needed. */
export function sourceForCompany(c: Company): DuplicateSource {
  return sourceFor(c.id);
}
