// Deterministic, on-the-fly generation of associated record samples
// (contacts, deals, tickets) for hover popovers. Stable per company id.

import type { ActivitySample, Company } from "./types";

export type ContactSample = {
  name: string;
  email: string;
  jobTitle: string;
  isPrimary?: boolean;
};

export type DealSample = {
  name: string;
  pipeline: string;
  stage: string;
  owner: string;
  amount: number;
};

export type TicketSample = {
  subject: string;
  status: string;
  owner: string;
  priority: string;
};

export type MixedActivity = ActivitySample & {
  channel: "emails" | "calls" | "meetings" | "notes" | "tasks";
};

const FIRST_NAMES = [
  "Quinn", "Avery", "Sage", "Morgan", "Riley", "Taylor", "Casey",
  "Logan", "Jamie", "Drew", "Skylar", "Reese", "Phoenix", "Rowan",
  "Kai", "Devon", "Harper", "Cameron", "Charlie", "Emerson",
  "Finley", "Hayden", "Indigo", "Justice", "Marlow", "Oakley",
  "Parker", "Reagan", "Sutton", "Tatum", "Wren", "Adair",
  "Blake", "Codie", "Ellis",
];

const LAST_NAMES = [
  "Stoneford", "Lakemoor", "Brookworth", "Hartwell", "Hollowby",
  "Whitford", "Thackeray", "Mendelin", "Vespermont", "Pemberford",
  "Ashbridge", "Cliffway", "Easton", "Fairview", "Glenleaf",
  "Hartmoor", "Inglewood", "Jensby", "Kingfair", "Lockmere",
  "Maybrook", "Norwell", "Oakshore", "Pinegrove", "Rowanvale",
  "Stallworth", "Thornedge", "Underwick",
];

const TITLES = [
  "Chief Operating Officer",
  "Head of Operations",
  "Director of Trading",
  "Portfolio Manager",
  "Senior Analyst",
  "Head of Compliance",
  "VP, Treasury",
  "Director, Securities Lending",
  "Investor Relations Lead",
  "Chief Investment Officer",
  "Head of Risk",
  "Director, Custody",
  "VP, Operations",
  "Head of Trading",
  "Senior Portfolio Manager",
  "Director, Margin Services",
  "Head of Prime Brokerage",
  "VP, Investor Relations",
  "Director of Finance",
  "Chief Financial Officer",
  "Head of Treasury",
  "Manager, Settlements",
  "Quantitative Researcher",
  "Head of ESG",
];

const DEAL_TEMPLATES = [
  "Annual platform subscription",
  "Margin program expansion",
  "PB onboarding",
  "Securities lending agreement",
  "Custody migration",
  "Tier upgrade — {tier}",
  "Outsourced trading",
  "Renewal {year}",
  "Q{q} platform expansion",
  "Repo program",
  "Treasury services",
  "Fixed income coverage",
];

const PIPELINES = [
  "Platform Subscription",
  "Margin & Financing",
  "Onboarding",
  "Renewal",
];

const STAGES = [
  "Discovery",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Won",
  "Closed Lost",
];

const TICKET_TEMPLATES = [
  "Margin call — escalation",
  "Trade settlement issue",
  "Wire reconciliation",
  "API access issue",
  "Reporting discrepancy — {month}",
  "Onboarding question",
  "Custody confirmation",
  "Statement issue — {month}",
  "Login access request",
  "Document upload failed",
  "Access role change",
  "Data feed delay",
  "Securities lending re-call",
];

const TICKET_STATUSES = [
  "Open",
  "In progress",
  "Waiting on customer",
  "Resolved",
  "Resolved",
  "Resolved",
];

const TICKET_PRIORITIES = ["Low", "Medium", "High"];

function hashSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function emailFromName(first: string, last: string, domain: string): string {
  const cleanLast = last.toLowerCase().replace(/[^a-z]/g, "");
  return `${first.toLowerCase()}.${cleanLast}@${domain}`;
}

function domainFromUrl(url: string): string {
  if (!url) return "company.com";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export function getContactSamples(company: Company): ContactSample[] {
  const rand = mulberry32(hashSeed(company.id + ":contacts"));
  const count = Math.min(company.associations.contacts, 5);
  const domain = domainFromUrl(company.properties.website_url);
  const out: ContactSample[] = [];
  const seenEmails = new Set<string>();
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let first: string;
    let last: string;
    let email: string;
    do {
      first = pick(FIRST_NAMES, rand);
      last = pick(LAST_NAMES, rand);
      email = emailFromName(first, last, domain);
      attempts++;
    } while (seenEmails.has(email) && attempts < 10);
    seenEmails.add(email);
    out.push({
      name: `${first} ${last}`,
      email,
      jobTitle: pick(TITLES, rand),
      isPrimary: i === 0,
    });
  }
  return out;
}

export function getDealSamples(company: Company): DealSample[] {
  const rand = mulberry32(hashSeed(company.id + ":deals"));
  const count = Math.min(company.associations.deals, 5);
  const out: DealSample[] = [];
  // first word of company name as short ref
  const shortName = company.properties.name.split(/[\s,]/)[0] || "Account";
  const owner =
    company.properties.company_owner ||
    company.properties.client_success_manager ||
    "Unassigned";
  const usedTemplates = new Set<string>();
  for (let i = 0; i < count; i++) {
    let template: string;
    let attempts = 0;
    do {
      template = pick(DEAL_TEMPLATES, rand);
      attempts++;
    } while (usedTemplates.has(template) && attempts < 8);
    usedTemplates.add(template);

    template = template
      .replace("{tier}", pick(["Tier 1", "Tier 2"], rand))
      .replace("{year}", pick(["2026", "2027"], rand))
      .replace("{q}", pick(["1", "2", "3", "4"], rand));

    // Realistic deal sizes for asset-management platform subscriptions: $50K–$3M
    const amount = Math.round((50_000 + rand() * 2_950_000) / 1000) * 1000;
    out.push({
      name: `${template} — ${shortName}`,
      pipeline: pick(PIPELINES, rand),
      stage: pick(STAGES, rand),
      owner,
      amount,
    });
  }
  return out;
}

export function getTicketSamples(company: Company): TicketSample[] {
  const rand = mulberry32(hashSeed(company.id + ":tickets"));
  const count = Math.min(company.associations.tickets, 5);
  const out: TicketSample[] = [];
  const owner =
    company.properties.client_success_manager ||
    company.properties.company_owner ||
    "Support";
  for (let i = 0; i < count; i++) {
    let template = pick(TICKET_TEMPLATES, rand);
    template = template.replace(
      "{month}",
      pick(["Q1", "Q2", "Q3", "Q4", "Mar", "Feb", "Jan"], rand)
    );
    out.push({
      subject: template,
      status: pick(TICKET_STATUSES, rand),
      owner,
      priority: pick(TICKET_PRIORITIES, rand),
    });
  }
  return out;
}

export function getMixedActivitySamples(company: Company): MixedActivity[] {
  const channels: MixedActivity["channel"][] = [
    "emails",
    "calls",
    "meetings",
    "notes",
    "tasks",
  ];
  const all: MixedActivity[] = [];
  for (const ch of channels) {
    company.activitySamples[ch].forEach((s) => all.push({ ...s, channel: ch }));
  }
  all.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return all.slice(0, 5);
}
