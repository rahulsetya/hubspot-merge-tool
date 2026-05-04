import type { CompanyProperties, LifecycleStage } from "./types";

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000_000_000)
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const diffDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const fmt = (s: string) => (future ? `in ${s}` : `${s} ago`);
  if (diffDays < 1) return future ? "soon" : "today";
  if (diffDays < 7) return fmt(`${diffDays}d`);
  if (diffDays < 30) return fmt(`${Math.floor(diffDays / 7)}w`);
  if (diffDays < 365) return fmt(`${Math.floor(diffDays / 30)}mo`);
  return fmt(`${Math.floor(diffDays / 365)}y`);
}

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  subscriber: "Subscriber",
  lead: "Lead",
  marketingqualifiedlead: "MQL",
  salesqualifiedlead: "SQL",
  opportunity: "Opportunity",
  customer: "Customer",
  evangelist: "Evangelist",
  other: "Other",
};

const LIFECYCLE_COLORS: Record<LifecycleStage, string> = {
  subscriber: "bg-slate-100 text-slate-700 ring-slate-200",
  lead: "bg-sky-50 text-sky-700 ring-sky-200",
  marketingqualifiedlead: "bg-violet-50 text-violet-700 ring-violet-200",
  salesqualifiedlead: "bg-amber-50 text-amber-700 ring-amber-200",
  opportunity: "bg-orange-50 text-orange-700 ring-orange-200",
  customer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  evangelist: "bg-pink-50 text-pink-700 ring-pink-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function lifecycleLabel(stage: LifecycleStage): string {
  return LIFECYCLE_LABELS[stage] ?? stage;
}

export function lifecycleColor(stage: LifecycleStage): string {
  return LIFECYCLE_COLORS[stage] ?? LIFECYCLE_COLORS.other;
}

export const PROPERTY_LABELS: Record<keyof CompanyProperties, string> = {
  name: "Company name",
  platform_company_id: "Platform CompanyID",
  category: "Category",
  subscription_end_date: "Subscription end date",
  company_owner: "Company owner",
  lifecyclestage: "Lifecycle",
  renewal_status: "Renewal status",
  auto_renew_status: "Auto renew status",
  account_segment: "Account segment",
  client_success_manager: "Client success manager",
  onboarding_complete: "Onboarding complete?",
  ir_contact_owner: "IR contact owner",
  firm_aum: "Firm AUM",
  street_address: "Street address",
  street_address_2: "Street address 2",
  city: "City",
  state: "State / Region",
  postal_code: "Postal code",
  country: "Country",
  website_url: "Website URL",
  primary_investment_strategy: "Primary investment strategy",
  description: "Description",
  portfolio_size: "Portfolio size",
  investor_category: "Investor category",
  ownership_attributes: "Ownership attributes",
  social_focus: "Social focus",
  onboarding_demo: "Onboarding demo",
  platform_engagement_tier: "Platform engagement tier",
  relationship_tier_am: "Relationship tier (AM)",
  tax_efficient: "Tax efficient",
  mfa_member: "MFA member",
  northwind_partnership: "Northwind partnership",
  createdate: "Created",
  hs_lastmodifieddate: "Last modified",
};

export const COMPARED_PROPERTIES: (keyof CompanyProperties)[] = [
  "name",
  "category",
  "subscription_end_date",
  "company_owner",
  "lifecyclestage",
  "renewal_status",
  "auto_renew_status",
  "account_segment",
  "client_success_manager",
  "onboarding_complete",
  "ir_contact_owner",
  "firm_aum",
  "street_address",
  "street_address_2",
  "city",
  "state",
  "postal_code",
  "country",
  "website_url",
  "primary_investment_strategy",
  "description",
  "portfolio_size",
  "investor_category",
  "ownership_attributes",
  "social_focus",
  "onboarding_demo",
  "platform_engagement_tier",
  "relationship_tier_am",
  "tax_efficient",
  "mfa_member",
  "northwind_partnership",
  "createdate",
  "hs_lastmodifieddate",
];

export function formatPropertyValue(
  key: keyof CompanyProperties,
  value: unknown
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.join(", ");
  }
  if (key === "firm_aum") return formatCurrency(value as number);
  if (
    key === "createdate" ||
    key === "hs_lastmodifieddate" ||
    key === "subscription_end_date"
  )
    return formatDate(value as string);
  if (key === "lifecyclestage") return lifecycleLabel(value as LifecycleStage);
  return String(value);
}
