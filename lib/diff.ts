import type { Company, CompanyProperties } from "./types";
import { COMPARED_PROPERTIES } from "./format";

export function hasConflict(
  key: keyof CompanyProperties,
  companies: Company[]
): boolean {
  if (companies.length < 2) return false;
  const values = companies.map((c) => normalize(c.properties[key]));
  const filled = values.filter((v) => v !== "");
  if (filled.length === 0) return false;
  const first = filled[0];
  return filled.some((v) => v !== first);
}

function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value))
    return value
      .slice()
      .map((v) => String(v).trim().toLowerCase())
      .sort()
      .join("|");
  if (typeof value === "string") return value.trim().toLowerCase();
  return String(value);
}

export function conflictCount(companies: Company[]): number {
  return COMPARED_PROPERTIES.filter((k) => hasConflict(k, companies)).length;
}

// Pick a recommended primary based on a simple heuristic:
// most associated activities + customer-stage bonus + recently-modified bonus.
export function recommendedPrimaryId(companies: Company[]): string {
  const STAGE_BONUS: Record<string, number> = {
    customer: 200,
    opportunity: 80,
    salesqualifiedlead: 40,
    marketingqualifiedlead: 20,
    lead: 5,
    subscriber: 0,
    evangelist: 250,
    other: 0,
  };
  let bestId = companies[0]?.id ?? "";
  let bestScore = -Infinity;
  for (const c of companies) {
    const stageBonus = STAGE_BONUS[c.properties.lifecyclestage] ?? 0;
    const recencyMs = new Date(c.properties.hs_lastmodifieddate).getTime();
    const recencyBonus = Number.isFinite(recencyMs) ? recencyMs / 1e10 : 0;
    const tierBonus =
      c.properties.platform_engagement_tier === "Tier 1"
        ? 30
        : c.properties.platform_engagement_tier === "Tier 2"
        ? 15
        : 0;
    const onboardingBonus =
      c.properties.onboarding_complete === "Yes" ? 50 : 0;
    const score =
      c.associations.activities +
      c.associations.deals * 50 +
      c.associations.contacts * 10 +
      stageBonus +
      tierBonus +
      onboardingBonus +
      recencyBonus;
    if (score > bestScore) {
      bestScore = score;
      bestId = c.id;
    }
  }
  return bestId;
}

export function combinedAssociations(companies: Company[]) {
  return companies.reduce(
    (acc, c) => ({
      contacts: acc.contacts + c.associations.contacts,
      deals: acc.deals + c.associations.deals,
      tickets: acc.tickets + c.associations.tickets,
      activities: acc.activities + c.associations.activities,
    }),
    { contacts: 0, deals: 0, tickets: 0, activities: 0 }
  );
}
