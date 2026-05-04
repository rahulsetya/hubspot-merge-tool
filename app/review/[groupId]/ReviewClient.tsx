"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  GitMerge,
  Mail,
  Calendar,
  PhoneCall,
  StickyNote,
  ListTodo,
  Users,
  Briefcase,
  LifeBuoy,
  Sparkles,
  X,
  Globe,
  MapPin,
  Phone,
  Type,
  IdCard,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  COMPARED_PROPERTIES,
  PROPERTY_LABELS,
  formatPropertyValue,
  formatDateTime,
  formatRelative,
} from "@/lib/format";
import {
  combinedAssociations,
  conflictCount,
  hasConflict,
  recommendedPrimaryId,
} from "@/lib/diff";
import {
  getMatchSignals,
  confidenceScore,
  confidenceLabel,
} from "@/lib/match-signals";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { ActivityPopover } from "@/components/ActivityPopover";
import {
  ContactsPopover,
  DealsPopover,
  TicketsPopover,
  RecentActivityPopover,
} from "@/components/AssocPopovers";
import {
  getContactSamples,
  getDealSamples,
  getTicketSamples,
  getMixedActivitySamples,
} from "@/lib/sample-gen";
import type {
  ActivityChannel,
  Company,
  CompanyProperties,
  MergeGroup,
  PropertyOverrides,
} from "@/lib/types";

export function ReviewClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { groups, completedGroupIds, audit, mergeGroup, resetSelection } =
    useStore();

  const group = groups.find((g) => g.id === groupId);
  const groupIndex = groups.findIndex((g) => g.id === groupId);
  const prevGroup = groups[groupIndex - 1];
  const nextGroup = groups[groupIndex + 1];

  const isDone = group ? completedGroupIds.has(group.id) : false;
  const completedEntry = audit.find((e) => e.groupId === groupId);

  const recommendedId = useMemo(
    () => (group ? recommendedPrimaryId(group.companies) : ""),
    [group]
  );

  const [primaryId, setPrimaryId] = useState<string>("");
  const [overrides, setOverrides] = useState<PropertyOverrides>({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (group) {
      const initialPrimary =
        completedEntry?.primaryCompanyId ||
        recommendedPrimaryId(group.companies);
      setPrimaryId(initialPrimary);
      // Reset overrides when navigating to a new group / re-loading.
      setOverrides(completedEntry?.propertyOverrides ?? {});
    }
  }, [group, completedEntry]);

  // When primary changes, drop any override that was pointing back to the new
  // primary (since it would now be a no-op) — but otherwise preserve user picks.
  useEffect(() => {
    if (!primaryId) return;
    setOverrides((prev) => {
      let changed = false;
      const next: PropertyOverrides = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === primaryId) {
          delete (next as Record<string, string | undefined>)[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [primaryId]);

  if (!group) return null;

  const conflicts = conflictCount(group.companies);
  const combined = combinedAssociations(group.companies);
  const cols = group.companies.length;

  const sourceForKey = (key: keyof CompanyProperties): string =>
    overrides[key] ?? primaryId;

  const setSourceForKey = (
    key: keyof CompanyProperties,
    sourceId: string
  ) => {
    setOverrides((prev) => {
      if (sourceId === primaryId) {
        const { [key]: _ignore, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: sourceId };
    });
  };

  const overrideCount = Object.keys(overrides).filter(
    (k) =>
      overrides[k as keyof CompanyProperties] &&
      overrides[k as keyof CompanyProperties] !== primaryId
  ).length;

  const handleMerge = () => {
    mergeGroup(group.id, primaryId, overrides);
    setConfirming(false);
  };

  return (
    <div className="px-8 py-6 max-w-[1600px]">
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Group {groupIndex + 1} of {groups.length}
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={prevGroup ? `/review/${prevGroup.id}` : "#"}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 ${
                prevGroup
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed pointer-events-none"
              }`}
              aria-label="Previous group"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={nextGroup ? `/review/${nextGroup.id}` : "#"}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 ${
                nextGroup
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed pointer-events-none"
              }`}
              aria-label="Next group"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {group.matchType === "platform-id" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 ring-1 ring-rose-200 px-2 py-1 rounded">
                  Sync-breaking · Platform CompanyID collision
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-1 rounded">
                  Name match · {((group.matchScore ?? 0) * 100).toFixed(0)}%
                  similarity
                </span>
              )}
              {group.matchType === "platform-id" &&
                group.platformCompanyId && (
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                    Platform CompanyID: {group.platformCompanyId}
                  </code>
                )}
              {isDone && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="h-3 w-3" />
                  Merged
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {group.displayName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {group.companies.length} duplicate records · {conflicts} property
              conflict{conflicts === 1 ? "" : "s"} ·{" "}
              {combined.activities.toLocaleString()} activities will be combined
            </p>
            {group.matchType === "platform-id" && (
              <p className="mt-2 text-xs text-rose-700 bg-rose-50 ring-1 ring-rose-200 px-3 py-2 rounded inline-block">
                Internal tooling can only sync one HubSpot company per Platform
                CompanyID. Until merged, only one of these records reaches the
                platform.
              </p>
            )}
          </div>
        </div>
      </div>

      <MatchSignalsPanel group={group} />

      {isDone && completedEntry ? (
        <CompletedView
          group={group}
          primaryId={completedEntry.primaryCompanyId}
          mergedAt={completedEntry.mergedAt}
          onUndo={() => resetSelection(group.id)}
          onNext={() => {
            if (nextGroup) router.push(`/review/${nextGroup.id}`);
            else router.push("/review");
          }}
          hasNext={!!nextGroup}
        />
      ) : (
        <>
          {cols <= 3 ? (
            <div
              className={`grid gap-4 mb-24 ${
                cols === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-3"
              }`}
            >
              {group.companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isPrimary={primaryId === company.id}
                  isRecommended={recommendedId === company.id}
                  onPick={() => setPrimaryId(company.id)}
                  allCompanies={group.companies}
                  sourceForKey={sourceForKey}
                  setSourceForKey={setSourceForKey}
                  primaryId={primaryId}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">
                  Comparing {cols} records — scroll horizontally to see all
                </div>
                <div className="text-[11px] text-slate-400">← scroll →</div>
              </div>
              <div className="compare-row overflow-x-auto pb-3 mb-24 -mx-1 px-1">
                <div className="flex gap-4" style={{ width: "max-content" }}>
                  {group.companies.map((company) => (
                    <div key={company.id} className="w-[420px] shrink-0">
                      <CompanyCard
                        company={company}
                        isPrimary={primaryId === company.id}
                        isRecommended={recommendedId === company.id}
                        onPick={() => setPrimaryId(company.id)}
                        allCompanies={group.companies}
                        sourceForKey={sourceForKey}
                        setSourceForKey={setSourceForKey}
                        primaryId={primaryId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="fixed bottom-4 left-[17rem] right-4 max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                <GitMerge className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  Merging into:{" "}
                  {group.companies.find((c) => c.id === primaryId)?.properties
                    .name ?? "—"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {combined.contacts} contacts combined
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {combined.deals} deals
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <LifeBuoy className="h-3 w-3" />
                    {combined.tickets} tickets
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {combined.activities.toLocaleString()} activities preserved
                  </span>
                  {overrideCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--brand-dark)]">
                      <Crown className="h-3 w-3" />
                      {overrideCount} property override
                      {overrideCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setConfirming(true)}
              disabled={!primaryId}
              className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Merge {group.companies.length} records
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {confirming && (
        <ConfirmModal
          group={group}
          primaryId={primaryId}
          overrides={overrides}
          onConfirm={handleMerge}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

// ---------- subcomponents ----------

function CompanyCard({
  company,
  isPrimary,
  isRecommended,
  onPick,
  allCompanies,
  sourceForKey,
  setSourceForKey,
  primaryId,
}: {
  company: Company;
  isPrimary: boolean;
  isRecommended: boolean;
  onPick: () => void;
  allCompanies: Company[];
  sourceForKey: (key: keyof CompanyProperties) => string;
  setSourceForKey: (key: keyof CompanyProperties, sourceId: string) => void;
  primaryId: string;
}) {
  return (
    <div
      onClick={onPick}
      className={`bg-white rounded-xl border-2 transition-all cursor-pointer ${
        isPrimary
          ? "border-[var(--brand)] shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div
        className={`px-5 py-4 border-b rounded-t-[10px] ${
          isPrimary
            ? "bg-[var(--brand-soft)] border-orange-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick();
            }}
            className="flex items-center gap-2 text-left"
          >
            <span
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isPrimary
                  ? "border-[var(--brand)] bg-[var(--brand)]"
                  : "border-slate-300 bg-white"
              }`}
            >
              {isPrimary && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isPrimary ? "text-[var(--brand-dark)]" : "text-slate-600"
              }`}
            >
              {isPrimary ? "Primary record" : "Use as primary"}
            </span>
          </button>
          {isRecommended && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 ring-1 ring-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
              <Crown className="h-3 w-3" />
              Recommended
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 leading-tight">
          {company.properties.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <LifecycleBadge stage={company.properties.lifecyclestage} />
          {company.properties.platform_engagement_tier && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded ring-1 bg-violet-50 text-violet-700 ring-violet-200">
              {company.properties.platform_engagement_tier}
            </span>
          )}
          <span className="text-xs text-slate-500">ID: {company.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/50 rounded-none">
        <AssocStat
          icon={Users}
          label="Contacts"
          value={company.associations.contacts}
          popover={
            <ContactsPopover
              contacts={getContactSamples(company)}
              total={company.associations.contacts}
              align="left"
            />
          }
        />
        <AssocStat
          icon={Briefcase}
          label="Deals"
          value={company.associations.deals}
          popover={
            <DealsPopover
              deals={getDealSamples(company)}
              total={company.associations.deals}
              align="center"
            />
          }
        />
        <AssocStat
          icon={LifeBuoy}
          label="Tickets"
          value={company.associations.tickets}
          popover={
            <TicketsPopover
              tickets={getTicketSamples(company)}
              total={company.associations.tickets}
              align="center"
            />
          }
        />
        <AssocStat
          icon={Sparkles}
          label="Activities"
          value={company.associations.activities}
          highlight
          popover={
            <RecentActivityPopover
              activities={getMixedActivitySamples(company)}
              total={company.associations.activities}
              align="right"
            />
          }
        />
      </div>

      <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-5 gap-2 text-[11px]">
        <ActivityPill
          channel="emails"
          icon={Mail}
          label="Emails"
          value={company.associations.emails}
          samples={company.activitySamples.emails}
          align="left"
        />
        <ActivityPill
          channel="calls"
          icon={PhoneCall}
          label="Calls"
          value={company.associations.calls}
          samples={company.activitySamples.calls}
          align="left"
        />
        <ActivityPill
          channel="meetings"
          icon={Calendar}
          label="Meetings"
          value={company.associations.meetings}
          samples={company.activitySamples.meetings}
          align="center"
        />
        <ActivityPill
          channel="notes"
          icon={StickyNote}
          label="Notes"
          value={company.associations.notes}
          samples={company.activitySamples.notes}
          align="right"
        />
        <ActivityPill
          channel="tasks"
          icon={ListTodo}
          label="Tasks"
          value={company.associations.tasks}
          samples={company.activitySamples.tasks}
          align="right"
        />
      </div>

      <div className="divide-y divide-slate-100">
        {COMPARED_PROPERTIES.map((key) => {
          const conflict = hasConflict(key, allCompanies);
          const value = company.properties[key];
          const winningSourceId = sourceForKey(key);
          const isWinning = winningSourceId === company.id;
          const isPrimarySource = company.id === primaryId;
          return (
            <PropertyRow
              key={key}
              propKey={key}
              value={value}
              conflict={conflict}
              isWinning={isWinning}
              isPrimarySource={isPrimarySource}
              onPick={
                conflict && !isWinning
                  ? (e) => {
                      e.stopPropagation();
                      setSourceForKey(key, company.id);
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 rounded-b-[10px] flex items-center justify-between text-[11px] text-slate-500">
        <span>Created {formatRelative(company.properties.createdate)}</span>
        <span>
          Modified {formatRelative(company.properties.hs_lastmodifieddate)}
        </span>
      </div>
    </div>
  );
}

function PropertyRow({
  propKey,
  value,
  conflict,
  isWinning,
  isPrimarySource,
  onPick,
}: {
  propKey: keyof CompanyProperties;
  value: unknown;
  conflict: boolean;
  isWinning: boolean;
  isPrimarySource: boolean;
  onPick?: (e: React.MouseEvent) => void;
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  // Visual state for the value cell
  let valueWrapperClass = "flex-1 min-w-0 rounded transition-colors";
  if (conflict) {
    if (isWinning) {
      // The winning cell on a conflicting row — solid brand outline.
      valueWrapperClass +=
        " ring-2 ring-[var(--brand)] bg-white px-2 py-1 -my-1 shadow-sm";
    } else {
      // A losing cell — clickable to override.
      valueWrapperClass +=
        " px-2 py-1 -my-1 opacity-60 hover:opacity-100 hover:bg-white hover:ring-1 hover:ring-slate-300 cursor-pointer";
    }
  }

  const valueText = (
    <div
      className={`text-sm break-words ${
        isEmpty
          ? "text-slate-400 italic"
          : conflict
          ? "text-slate-900"
          : "text-slate-800"
      }`}
    >
      {renderPropertyValue(propKey, value, isEmpty)}
    </div>
  );

  return (
    <div
      className={`px-5 py-2.5 flex items-start gap-3 ${
        conflict ? "bg-amber-50/40" : ""
      }`}
    >
      <div className="w-36 shrink-0 text-[11px] font-medium text-slate-500 uppercase tracking-wide pt-0.5">
        {PROPERTY_LABELS[propKey]}
      </div>
      {conflict && !isWinning && onPick ? (
        <button
          type="button"
          onClick={onPick}
          className={valueWrapperClass + " text-left"}
          title="Click to use this value in the merged record"
        >
          {valueText}
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Click to use this value →
          </div>
        </button>
      ) : (
        <div className={valueWrapperClass}>
          {valueText}
          {conflict && isWinning && (
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <CheckCircle2 className="h-3 w-3 text-[var(--brand)]" />
              <span className="font-semibold text-[var(--brand-dark)]">
                Winning value
                {isPrimarySource ? " · primary" : " · override"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderPropertyValue(
  key: keyof CompanyProperties,
  value: unknown,
  isEmpty: boolean
) {
  if (isEmpty) return "—";
  if (key === "lifecyclestage") {
    return <LifecycleBadge stage={value as never} />;
  }
  if (key === "social_focus" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center text-[11px] bg-white border border-slate-300 text-slate-700 rounded px-1.5 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }
  if (key === "website_url") {
    return (
      <span className="text-sky-700 underline decoration-sky-200 underline-offset-2 break-all">
        {String(value)}
      </span>
    );
  }
  if (
    key === "platform_engagement_tier" ||
    key === "relationship_tier_am"
  ) {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 ring-1 ring-violet-200">
        {String(value)}
      </span>
    );
  }
  if (
    key === "mfa_member" ||
    key === "northwind_partnership" ||
    key === "tax_efficient" ||
    key === "onboarding_complete"
  ) {
    const v = String(value);
    const yes = v.toLowerCase() === "yes";
    return (
      <span
        className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ring-1 ${
          yes
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-slate-100 text-slate-700 ring-slate-200"
        }`}
      >
        {v}
      </span>
    );
  }
  if (key === "renewal_status") {
    const v = String(value);
    const color =
      v === "Renewed"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : v === "At risk" || v === "Lost"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";
    return (
      <span
        className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ring-1 ${color}`}
      >
        {v}
      </span>
    );
  }
  return formatPropertyValue(key, value);
}

function AssocStat({
  icon: Icon,
  label,
  value,
  highlight,
  popover,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
  popover?: React.ReactNode;
}) {
  return (
    <div
      className="relative group px-3 py-3 border-r border-slate-200 last:border-r-0 text-center cursor-help"
      tabIndex={0}
    >
      <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <div
        className={`text-lg font-semibold tabular-nums ${
          highlight ? "text-[var(--brand-dark)]" : "text-slate-900"
        }`}
      >
        {value.toLocaleString()}
      </div>
      {popover}
    </div>
  );
}

function ActivityPill({
  channel,
  icon: Icon,
  label,
  value,
  samples,
  align,
}: {
  channel: ActivityChannel;
  icon: React.ElementType;
  label: string;
  value: number;
  samples: import("@/lib/types").ActivitySample[];
  align: "left" | "center" | "right";
}) {
  return (
    <div className="relative group" tabIndex={0}>
      <div
        className="flex items-center justify-center gap-1 text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-1 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-help"
        data-channel={channel}
      >
        <Icon className="h-3 w-3" />
        <span className="tabular-nums font-medium">{value}</span>
      </div>
      <ActivityPopover
        label={label}
        total={value}
        samples={samples}
        align={align}
      />
    </div>
  );
}

function ConfirmModal({
  group,
  primaryId,
  overrides,
  onConfirm,
  onCancel,
}: {
  group: MergeGroup;
  primaryId: string;
  overrides: PropertyOverrides;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const primary = group.companies.find((c) => c.id === primaryId);
  const others = group.companies.filter((c) => c.id !== primaryId);
  const combined = combinedAssociations(group.companies);
  if (!primary) return null;

  // Build override list: properties that come from a non-primary record.
  const overrideList = Object.entries(overrides)
    .filter(([, sourceId]) => sourceId && sourceId !== primaryId)
    .map(([key, sourceId]) => {
      const source = group.companies.find((c) => c.id === sourceId);
      const k = key as keyof CompanyProperties;
      return {
        key: k,
        label: PROPERTY_LABELS[k],
        primaryValue: primary.properties[k],
        sourceCompanyName: source?.properties.name ?? "Unknown",
        sourceValue: source?.properties[k] ?? null,
      };
    });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Confirm merge
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              This action is irreversible in HubSpot. Review what will happen.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 -mt-1 -mr-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
              Surviving record
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-900">
                  {primary.properties.name}
                </span>
                <LifecycleBadge stage={primary.properties.lifecyclestage} />
              </div>
              <div className="text-xs text-slate-600 ml-6">
                {primary.properties.website_url || "—"} ·{" "}
                {primary.properties.city || "—"} · Owner:{" "}
                {primary.properties.company_owner || "—"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 mb-2">
              Will be merged in &amp; removed
            </div>
            <div className="space-y-2">
              {others.map((c) => (
                <div
                  key={c.id}
                  className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm"
                >
                  <div className="font-medium text-slate-900">
                    {c.properties.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Activity, contacts, deals, and tickets re-parented to
                    surviving record
                  </div>
                </div>
              ))}
            </div>
          </div>

          {overrideList.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-dark)] mb-2 flex items-center gap-1.5">
                <Crown className="h-3 w-3" />
                Property overrides ({overrideList.length})
              </div>
              <div className="border border-orange-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--brand-soft)]">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-dark)]">
                        Property
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-dark)]">
                        Primary value (replaced)
                      </th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-dark)]">
                        Will use
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {overrideList.map((o) => (
                      <tr key={o.key}>
                        <td className="px-3 py-2 text-xs font-medium text-slate-700 align-top">
                          {o.label}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 line-through align-top break-words">
                          {formatPropertyValue(o.key, o.primaryValue)}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs font-medium text-slate-900 break-words">
                            {formatPropertyValue(o.key, o.sourceValue)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            from {o.sourceCompanyName}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-3">
              After merge, surviving record will have
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {combined.contacts}
                </div>
                <div className="text-xs text-slate-500">Contacts</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {combined.deals}
                </div>
                <div className="text-xs text-slate-500">Deals</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {combined.tickets}
                </div>
                <div className="text-xs text-slate-500">Tickets</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[var(--brand-dark)] tabular-nums">
                  {combined.activities.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">Activities</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] rounded-md shadow-sm transition-colors"
          >
            Confirm merge
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Match signals panel ----------

const SIGNAL_ICON: Record<string, React.ElementType> = {
  "platform-id": IdCard,
  domain: Globe,
  address: MapPin,
  phone: Phone,
  "name-similarity": Type,
  "ir-contact": UserCheck,
  "company-owner": Users,
};

function MatchSignalsPanel({ group }: { group: MergeGroup }) {
  const signals = useMemo(() => getMatchSignals(group), [group]);
  const score = useMemo(() => confidenceScore(signals), [signals]);
  const tone = confidenceLabel(score);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Why these are flagged as duplicates
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            · {signals.length} signal{signals.length === 1 ? "" : "s"} matched
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">
            Confidence
          </span>
          <span
            className={`inline-flex items-center text-xs font-bold tabular-nums px-2 py-0.5 rounded ring-1 ${tone.color}`}
          >
            {(score * 100).toFixed(0)}% · {tone.label}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2 px-5 py-4">
        {signals.length === 0 ? (
          <div className="col-span-full text-xs text-slate-500 italic">
            No detection signals matched.
          </div>
        ) : (
          signals.map((s) => {
            const Icon = SIGNAL_ICON[s.type] ?? ShieldCheck;
            const strong = s.confidence >= 0.85;
            const medium = s.confidence >= 0.5 && s.confidence < 0.85;
            const tint = strong
              ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
              : medium
              ? "text-amber-700 bg-amber-50 ring-amber-200"
              : "text-slate-600 bg-slate-50 ring-slate-200";
            return (
              <div
                key={s.type + s.label}
                className="flex items-start gap-2.5 py-1"
              >
                <span
                  className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ring-1 ${tint}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {s.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold tabular-nums px-1 py-0.5 rounded ${
                        strong
                          ? "text-emerald-700"
                          : medium
                          ? "text-amber-700"
                          : "text-slate-500"
                      }`}
                    >
                      {(s.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.detail}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CompletedView({
  group,
  primaryId,
  mergedAt,
  onUndo,
  onNext,
  hasNext,
}: {
  group: MergeGroup;
  primaryId: string;
  mergedAt: string;
  onUndo: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const primary = group.companies.find((c) => c.id === primaryId);
  const others = group.companies.filter((c) => c.id !== primaryId);
  const combined = combinedAssociations(group.companies);
  if (!primary) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">
            Merge complete · {formatDateTime(mergedAt)}
          </div>
          <div className="text-sm text-slate-600 mt-0.5">
            {others.length} duplicate{others.length === 1 ? "" : "s"} merged
            into {primary.properties.name}
          </div>
        </div>
        <button
          onClick={onUndo}
          className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 hover:bg-white rounded-md transition-colors"
        >
          Undo
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
            Surviving record
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">
                {primary.properties.name}
              </span>
              <LifecycleBadge stage={primary.properties.lifecyclestage} />
            </div>
            <div className="text-xs text-slate-600">
              {primary.properties.website_url} · Owner:{" "}
              {primary.properties.company_owner}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Activities preserved on surviving record
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatTile label="Contacts" value={combined.contacts} />
            <StatTile label="Deals" value={combined.deals} />
            <StatTile label="Tickets" value={combined.tickets} />
            <StatTile
              label="Activities"
              value={combined.activities}
              highlight
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/audit"
            className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            View in audit log
          </Link>
          {hasNext && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              Next group
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div
        className={`text-2xl font-semibold tabular-nums ${
          highlight ? "text-[var(--brand-dark)]" : "text-slate-900"
        }`}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
