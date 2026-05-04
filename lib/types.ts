export type LifecycleStage =
  | "subscriber"
  | "lead"
  | "marketingqualifiedlead"
  | "salesqualifiedlead"
  | "opportunity"
  | "customer"
  | "evangelist"
  | "other";

export type CompanyProperties = {
  name: string;
  platform_company_id: string;
  category: string;
  subscription_end_date: string;
  company_owner: string;
  lifecyclestage: LifecycleStage;
  renewal_status: string;
  auto_renew_status: string;
  account_segment: string;
  client_success_manager: string;
  onboarding_complete: "Yes" | "No" | "";
  ir_contact_owner: string;
  firm_aum: number | null;
  street_address: string;
  street_address_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website_url: string;
  primary_investment_strategy: string;
  description: string;
  portfolio_size: string;
  investor_category: string;
  ownership_attributes: string;
  social_focus: string[];
  onboarding_demo: string;
  platform_engagement_tier: string;
  relationship_tier_am: string;
  tax_efficient: string;
  mfa_member: "Yes" | "No" | "";
  northwind_partnership: "Yes" | "No" | "";
  createdate: string;
  hs_lastmodifieddate: string;
};

export type CompanyAssociations = {
  contacts: number;
  deals: number;
  tickets: number;
  activities: number;
  notes: number;
  emails: number;
  calls: number;
  meetings: number;
  tasks: number;
};

export type ActivitySample = {
  subject: string;
  timestamp: string;
  owner: string;
  detail?: string;
};

export type ActivityChannel = "emails" | "calls" | "meetings" | "notes" | "tasks";

export type CompanyActivitySamples = Record<ActivityChannel, ActivitySample[]>;

export type Company = {
  id: string;
  platformCompanyId: string;
  properties: CompanyProperties;
  associations: CompanyAssociations;
  activitySamples: CompanyActivitySamples;
};

export type MatchType = "platform-id" | "name";

export type MergeGroup = {
  id: string;
  matchType: MatchType;
  platformCompanyId: string; // collision ID for "platform-id"; representative ID (or empty) for "name"
  displayName: string;
  companies: Company[];
  matchScore?: number; // 0..1, only on name-match groups
};

export type PropertyOverrides = Partial<
  Record<keyof CompanyProperties, string>
>;

export type AuditEntry = {
  id: string;
  groupId: string;
  platformCompanyId: string;
  primaryCompanyId: string;
  mergedCompanyIds: string[];
  snapshot: Company[];
  mergedAt: string;
  mergedBy: string;
  associationsCombined: {
    contacts: number;
    deals: number;
    tickets: number;
    activities: number;
  };
  /** Map of propertyKey -> sourceCompanyId for properties NOT taken from primary. */
  propertyOverrides?: PropertyOverrides;
  /** The properties of the surviving record after applying overrides. */
  mergedProperties?: CompanyProperties;
};
