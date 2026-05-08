// Seed roster for the Leaderboard page.
// All names, teams, and figures here are fabricated for the demo.

export type LeaderboardEntry = {
  id: string;
  name: string;
  role: string;
  team: string;
  /** Avatar background color (Tailwind classes, applied to a rounded square). */
  avatarTone: string;
  mergesAllTime: number;
  mergesLast30: number;
  recordsRemoved: number;
  activitiesPreserved: number;
  /** Days since their last merge — used for a "Last activity" column. */
  lastMergeDaysAgo: number;
  /** Optional badge text shown next to their name. */
  badge?: "Top streak" | "First merger" | "Data hawk" | "New this month";
};

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "lb_01",
    name: "Adair Pinegrove",
    role: "CRM Ops Lead",
    team: "RevOps",
    avatarTone: "bg-emerald-100 text-emerald-700",
    mergesAllTime: 247,
    mergesLast30: 58,
    recordsRemoved: 491,
    activitiesPreserved: 18_420,
    lastMergeDaysAgo: 0,
    badge: "Top streak",
  },
  {
    id: "lb_02",
    name: "Blake Norwell",
    role: "Senior RevOps Analyst",
    team: "RevOps",
    avatarTone: "bg-violet-100 text-violet-700",
    mergesAllTime: 211,
    mergesLast30: 47,
    recordsRemoved: 408,
    activitiesPreserved: 15_960,
    lastMergeDaysAgo: 0,
  },
  {
    id: "lb_03",
    name: "Codie Maybrook",
    role: "Data Quality Specialist",
    team: "Data Team",
    avatarTone: "bg-amber-100 text-amber-700",
    mergesAllTime: 184,
    mergesLast30: 41,
    recordsRemoved: 358,
    activitiesPreserved: 13_104,
    lastMergeDaysAgo: 1,
    badge: "Data hawk",
  },
  {
    id: "lb_04",
    name: "Ellis Stallworth",
    role: "HubSpot Admin",
    team: "Marketing Ops",
    avatarTone: "bg-sky-100 text-sky-700",
    mergesAllTime: 156,
    mergesLast30: 33,
    recordsRemoved: 290,
    activitiesPreserved: 11_280,
    lastMergeDaysAgo: 1,
  },
  {
    id: "lb_05",
    name: "Wren Thornedge",
    role: "Sales Operations Analyst",
    team: "Sales Ops",
    avatarTone: "bg-rose-100 text-rose-700",
    mergesAllTime: 132,
    mergesLast30: 29,
    recordsRemoved: 244,
    activitiesPreserved: 9_512,
    lastMergeDaysAgo: 2,
  },
  {
    id: "lb_06",
    name: "Marlow Underwick",
    role: "Customer Ops Manager",
    team: "Customer Ops",
    avatarTone: "bg-teal-100 text-teal-700",
    mergesAllTime: 118,
    mergesLast30: 24,
    recordsRemoved: 218,
    activitiesPreserved: 8_204,
    lastMergeDaysAgo: 2,
  },
  {
    id: "lb_07",
    name: "Oakley Glenleaf",
    role: "RevOps Coordinator",
    team: "RevOps",
    avatarTone: "bg-indigo-100 text-indigo-700",
    mergesAllTime: 96,
    mergesLast30: 21,
    recordsRemoved: 174,
    activitiesPreserved: 6_730,
    lastMergeDaysAgo: 3,
  },
  {
    id: "lb_08",
    name: "Reagan Lockmere",
    role: "Marketing Ops Specialist",
    team: "Marketing Ops",
    avatarTone: "bg-fuchsia-100 text-fuchsia-700",
    mergesAllTime: 81,
    mergesLast30: 18,
    recordsRemoved: 148,
    activitiesPreserved: 5_544,
    lastMergeDaysAgo: 4,
  },
  {
    id: "lb_09",
    name: "Sutton Inglewood",
    role: "Data Operations Analyst",
    team: "Data Team",
    avatarTone: "bg-lime-100 text-lime-700",
    mergesAllTime: 67,
    mergesLast30: 14,
    recordsRemoved: 121,
    activitiesPreserved: 4_398,
    lastMergeDaysAgo: 5,
  },
  {
    id: "lb_10",
    name: "Tatum Kingfair",
    role: "RevOps Associate",
    team: "RevOps",
    avatarTone: "bg-cyan-100 text-cyan-700",
    mergesAllTime: 54,
    mergesLast30: 12,
    recordsRemoved: 96,
    activitiesPreserved: 3_580,
    lastMergeDaysAgo: 7,
    badge: "New this month",
  },
  {
    id: "lb_11",
    name: "Phoenix Ashbridge",
    role: "Sales Ops Analyst",
    team: "Sales Ops",
    avatarTone: "bg-orange-100 text-orange-700",
    mergesAllTime: 42,
    mergesLast30: 9,
    recordsRemoved: 74,
    activitiesPreserved: 2_868,
    lastMergeDaysAgo: 9,
  },
  {
    id: "lb_12",
    name: "Hayden Cliffway",
    role: "Customer Ops Coordinator",
    team: "Customer Ops",
    avatarTone: "bg-slate-200 text-slate-700",
    mergesAllTime: 31,
    mergesLast30: 6,
    recordsRemoved: 53,
    activitiesPreserved: 1_944,
    lastMergeDaysAgo: 12,
    badge: "First merger",
  },
];

export type LeaderboardPeriod = "last30" | "allTime";

export function rankFor(period: LeaderboardPeriod): LeaderboardEntry[] {
  const key: keyof LeaderboardEntry =
    period === "last30" ? "mergesLast30" : "mergesAllTime";
  return [...LEADERBOARD].sort(
    (a, b) => (b[key] as number) - (a[key] as number)
  );
}

/** Rough total used in a top-of-page summary card. */
export function totalsFor(period: LeaderboardPeriod) {
  const key: keyof LeaderboardEntry =
    period === "last30" ? "mergesLast30" : "mergesAllTime";
  const ranked = rankFor(period);
  const totalMerges = ranked.reduce(
    (s, e) => s + (e[key] as number),
    0
  );
  const totalRecordsRemoved = ranked.reduce(
    (s, e) =>
      s +
      Math.round(
        (e.recordsRemoved * (e[key] as number)) /
          Math.max(e.mergesAllTime, 1)
      ),
    0
  );
  const totalActivities = ranked.reduce(
    (s, e) =>
      s +
      Math.round(
        (e.activitiesPreserved * (e[key] as number)) /
          Math.max(e.mergesAllTime, 1)
      ),
    0
  );
  return { totalMerges, totalRecordsRemoved, totalActivities };
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
