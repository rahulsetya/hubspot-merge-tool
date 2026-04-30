// Detection signals — multi-rule duplicate detection beyond just Platform
// CompanyID. Each signal contributes to a per-group confidence score.

import type { Company, MergeGroup } from "./types";

export type SignalType =
  | "platform-id"
  | "domain"
  | "address"
  | "phone"
  | "name-similarity"
  | "ir-contact"
  | "company-owner";

export type MatchSignal = {
  type: SignalType;
  label: string;
  confidence: number; // 0..1
  detail: string;
  weight: number; // contribution to overall score
};

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,'’]/g, "")
    .replace(/\b(inc|llc|ltd|lp|llp|corp|co|company|the)\b/g, "")
    .trim();
}

function domainOf(url: string): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

function rootDomain(domain: string): string {
  // Strip subdomains; keep last 2 labels for most TLDs (good enough for demo).
  const parts = domain.split(".");
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join(".");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function nameSimilarity(companies: Company[]): number {
  if (companies.length < 2) return 1;
  const names = companies.map((c) => normalize(c.properties.name));
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const dist = levenshtein(names[i], names[j]);
      const maxLen = Math.max(names[i].length, names[j].length, 1);
      total += 1 - dist / maxLen;
      pairs++;
    }
  }
  return pairs > 0 ? total / pairs : 0;
}

function allEqualNonEmpty<T>(values: T[]): boolean {
  const filled = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (filled.length < 2) return false;
  const first = filled[0];
  return filled.every((v) => v === first);
}

function shareCount<T>(values: T[]): number {
  // count of records sharing the most common non-empty value
  const filled = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (filled.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const v of filled) {
    const k = String(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Math.max(...counts.values());
}

export function getMatchSignals(group: MergeGroup): MatchSignal[] {
  const cs = group.companies;
  const signals: MatchSignal[] = [];

  // 1. Platform CompanyID
  if (group.matchType === "platform-id") {
    signals.push({
      type: "platform-id",
      label: "Same Platform CompanyID",
      confidence: 1,
      detail: `All ${cs.length} records share ID "${group.platformCompanyId}"`,
      weight: 0.45,
    });
  } else {
    // For name-match groups, check if any have shared Platform CompanyID
    const ids = cs.map((c) => c.platformCompanyId).filter(Boolean);
    const distinct = new Set(ids).size;
    if (ids.length === 0) {
      signals.push({
        type: "platform-id",
        label: "Platform CompanyID — missing",
        confidence: 0,
        detail: "No record has a Platform CompanyID assigned",
        weight: 0,
      });
    } else if (distinct === 1 && ids.length === cs.length) {
      signals.push({
        type: "platform-id",
        label: "Same Platform CompanyID",
        confidence: 1,
        detail: `All ${cs.length} records share ID`,
        weight: 0.45,
      });
    } else {
      signals.push({
        type: "platform-id",
        label: "Platform CompanyID — mixed",
        confidence: 0.4,
        detail:
          ids.length < cs.length
            ? `${cs.length - ids.length} of ${cs.length} records missing ID`
            : `${distinct} different IDs assigned`,
        weight: 0.05,
      });
    }
  }

  // 2. Domain match
  const domains = cs
    .map((c) => domainOf(c.properties.website_url))
    .filter(Boolean);
  const rootDomains = domains.map(rootDomain);
  if (domains.length >= 2) {
    const allSame = allEqualNonEmpty(domains);
    const allSameRoot = allEqualNonEmpty(rootDomains);
    if (allSame) {
      signals.push({
        type: "domain",
        label: "Same domain",
        confidence: 1,
        detail: domains[0],
        weight: 0.2,
      });
    } else if (allSameRoot) {
      signals.push({
        type: "domain",
        label: "Same root domain",
        confidence: 0.85,
        detail: `${rootDomains[0]} (subdomain or path differs)`,
        weight: 0.15,
      });
    } else {
      const sharing = shareCount(rootDomains);
      const ratio = sharing / cs.length;
      if (ratio >= 0.5) {
        signals.push({
          type: "domain",
          label: "Partial domain match",
          confidence: ratio * 0.7,
          detail: `${sharing} of ${cs.length} share root domain`,
          weight: 0.05,
        });
      }
    }
  }

  // 3. Name similarity
  const sim = group.matchScore ?? nameSimilarity(cs);
  if (sim >= 0.6) {
    signals.push({
      type: "name-similarity",
      label: "Company name match",
      confidence: sim,
      detail: `${(sim * 100).toFixed(0)}% similarity across records`,
      weight: 0.2 * sim,
    });
  }

  // 4. Address match — compare normalized street + postal
  const streets = cs.map((c) =>
    normalize(c.properties.street_address)
  );
  const postals = cs.map((c) => c.properties.postal_code).filter(Boolean);
  if (postals.length >= 2 && allEqualNonEmpty(postals)) {
    const streetMatch =
      streets.filter(Boolean).length >= 2 && allEqualNonEmpty(streets);
    signals.push({
      type: "address",
      label: streetMatch ? "Same street address" : "Same postal code",
      confidence: streetMatch ? 1 : 0.7,
      detail: streetMatch
        ? `${cs[0].properties.street_address}, ${postals[0]}`
        : postals[0],
      weight: streetMatch ? 0.15 : 0.07,
    });
  }

  // 5. IR contact owner overlap
  const irOwners = cs
    .map((c) => c.properties.ir_contact_owner)
    .filter((v) => v && v !== "No owner");
  if (irOwners.length >= 2 && allEqualNonEmpty(irOwners)) {
    signals.push({
      type: "ir-contact",
      label: "Same IR contact owner",
      confidence: 0.9,
      detail: `${irOwners[0]} owns IR for all records`,
      weight: 0.1,
    });
  }

  // 6. Company owner overlap
  const owners = cs.map((c) => c.properties.company_owner).filter(Boolean);
  if (owners.length >= 2 && allEqualNonEmpty(owners)) {
    signals.push({
      type: "company-owner",
      label: "Same company owner",
      confidence: 0.7,
      detail: `${owners[0]} owns all records`,
      weight: 0.05,
    });
  }

  return signals;
}

export function confidenceScore(signals: MatchSignal[]): number {
  if (signals.length === 0) return 0;
  // Weighted aggregate, capped at 1
  const score = signals.reduce(
    (acc, s) => acc + s.confidence * s.weight,
    0
  );
  return Math.min(1, score);
}

export function confidenceLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 0.85)
    return { label: "Very high", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (score >= 0.7)
    return { label: "High", color: "bg-sky-50 text-sky-700 ring-sky-200" };
  if (score >= 0.5)
    return { label: "Medium", color: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "Low", color: "bg-slate-100 text-slate-700 ring-slate-200" };
}
