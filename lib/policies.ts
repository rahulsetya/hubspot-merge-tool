// Auto-merge policy evaluation. Given a policy and the pending duplicate
// groups, returns the groups that match (and would be auto-merged) and
// the groups that fail with a human-readable reason.

import { conflictCount } from "./diff";
import { confidenceScore, getMatchSignals } from "./match-signals";
import type { Company, MergeGroup } from "./types";

export type AutoMergePolicy = {
  /** Minimum confidence percentage (0..100) the group must score. */
  minConfidence: number;
  /** Require a Platform CompanyID collision to qualify. */
  requirePlatformId: boolean;
  /** Require shared root domain across the group. */
  requireDomain: boolean;
  /** Require shared street address across the group. */
  requireAddress: boolean;
  /** Records with AUM above this threshold are routed to manual review. */
  maxAumForAuto: number; // dollars
  /** Skip groups with more than this many conflicting properties. */
  maxConflicts: number;
};

export const DEFAULT_POLICY: AutoMergePolicy = {
  minConfidence: 85,
  requirePlatformId: true,
  requireDomain: false,
  requireAddress: false,
  maxAumForAuto: 250_000_000_000, // $250B
  maxConflicts: 15,
};

export type PolicyEvalResult = {
  group: MergeGroup;
  matched: boolean;
  reasons: string[];
  confidence: number;
  conflicts: number;
  primaryCompanyId: string;
};

function rootDomain(url: string): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

function pickPrimary(g: MergeGroup): Company {
  // Pick the company with the most "filled" properties — proxy for "richest"
  // record, which is usually what humans pick anyway.
  const score = (c: Company) => {
    const p = c.properties;
    let s = 0;
    s += p.company_owner ? 2 : 0;
    s += p.client_success_manager ? 2 : 0;
    s += p.subscription_end_date ? 2 : 0;
    s += p.firm_aum ? 1 : 0;
    s += p.platform_engagement_tier ? 1 : 0;
    s += p.lifecyclestage && p.lifecyclestage !== "other" ? 1 : 0;
    s += p.website_url ? 1 : 0;
    s += p.description ? 1 : 0;
    return s;
  };
  return [...g.companies].sort((a, b) => score(b) - score(a))[0];
}

export function evaluatePolicy(
  policy: AutoMergePolicy,
  groups: MergeGroup[]
): PolicyEvalResult[] {
  return groups.map((g) => {
    const reasons: string[] = [];
    const signals = getMatchSignals(g);
    const confidence = Math.round(confidenceScore(signals) * 100);
    const conflicts = conflictCount(g.companies);
    const primary = pickPrimary(g);
    const maxAum = Math.max(
      ...g.companies.map((c) => c.properties.firm_aum ?? 0)
    );
    const domains = new Set(
      g.companies
        .map((c) => rootDomain(c.properties.website_url))
        .filter(Boolean)
    );
    const addresses = new Set(
      g.companies
        .map((c) =>
          [c.properties.street_address, c.properties.postal_code]
            .filter(Boolean)
            .join("|")
            .toLowerCase()
        )
        .filter(Boolean)
    );

    if (confidence < policy.minConfidence) {
      reasons.push(
        `Confidence ${confidence}% below threshold (${policy.minConfidence}%)`
      );
    }
    if (policy.requirePlatformId && g.matchType !== "platform-id") {
      reasons.push("Not a Platform CompanyID collision");
    }
    if (policy.requireDomain && domains.size !== 1) {
      reasons.push(
        domains.size === 0
          ? "Missing website on at least one record"
          : "Records have different domains"
      );
    }
    if (policy.requireAddress && addresses.size !== 1) {
      reasons.push(
        addresses.size === 0
          ? "Missing address on at least one record"
          : "Records have different addresses"
      );
    }
    if (maxAum > policy.maxAumForAuto) {
      reasons.push(
        `AUM $${(maxAum / 1_000_000_000).toFixed(0)}B exceeds auto-merge limit`
      );
    }
    if (conflicts > policy.maxConflicts) {
      reasons.push(
        `${conflicts} property conflicts (max ${policy.maxConflicts})`
      );
    }

    return {
      group: g,
      matched: reasons.length === 0,
      reasons,
      confidence,
      conflicts,
      primaryCompanyId: primary.id,
    };
  });
}

export function summarizePolicy(results: PolicyEvalResult[]) {
  const matched = results.filter((r) => r.matched);
  const skipped = results.filter((r) => !r.matched);
  const skipReasons = new Map<string, number>();
  for (const r of skipped) {
    for (const reason of r.reasons) {
      const key = reason.replace(/\d+/g, "N");
      skipReasons.set(key, (skipReasons.get(key) ?? 0) + 1);
    }
  }
  return {
    matched,
    skipped,
    matchedCount: matched.length,
    skippedCount: skipped.length,
    skipReasonsRanked: [...skipReasons.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count })),
  };
}
