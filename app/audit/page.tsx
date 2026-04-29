"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  History,
  Activity,
  Briefcase,
  Users,
  LifeBuoy,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { LifecycleBadge } from "@/components/LifecycleBadge";

export default function AuditPage() {
  const { audit, groups, loaded } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalActivities = audit.reduce(
    (s, e) => s + e.associationsCombined.activities,
    0
  );
  const totalContacts = audit.reduce(
    (s, e) => s + e.associationsCombined.contacts,
    0
  );
  const totalDeals = audit.reduce(
    (s, e) => s + e.associationsCombined.deals,
    0
  );
  const totalRecordsRemoved = audit.reduce(
    (s, e) => s + e.mergedCompanyIds.length,
    0
  );

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(audit, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merge-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Audit log
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            Append-only record of every merge. In production this would be the
            evidence trail for every operation against your CRM.
          </p>
        </div>
        {audit.length > 0 && (
          <button
            onClick={downloadJson}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-md shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
        )}
      </div>

      {loaded && audit.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SmallStat
            label="Merges completed"
            value={audit.length}
            icon={CheckCircle2}
          />
          <SmallStat
            label="Records removed"
            value={totalRecordsRemoved}
            icon={History}
          />
          <SmallStat
            label="Activities preserved"
            value={totalActivities.toLocaleString()}
            icon={Activity}
          />
          <SmallStat
            label="Contacts + deals re-parented"
            value={totalContacts + totalDeals}
            icon={Briefcase}
          />
        </div>
      )}

      {!loaded ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-500">
          Loading…
        </div>
      ) : audit.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <History className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900">No merges yet</h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            When you merge a duplicate group, an audit entry is recorded here
            with a full pre-merge snapshot of every record.
          </p>
          <Link
            href="/review"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[var(--brand-dark)] hover:text-[var(--brand)]"
          >
            Go to review queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {audit.map((entry) => {
              const group = groups.find((g) => g.id === entry.groupId);
              const primary = entry.snapshot.find(
                (c) => c.id === entry.primaryCompanyId
              );
              const merged = entry.snapshot.filter(
                (c) => c.id !== entry.primaryCompanyId
              );
              const isExpanded = expanded.has(entry.id);
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => toggle(entry.id)}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                  >
                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {group?.displayName ?? entry.platformCompanyId}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          {entry.platformCompanyId}
                        </code>
                        <span>
                          {entry.mergedCompanyIds.length} merged in
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(entry.mergedAt)}</span>
                        <span>·</span>
                        <span>by {entry.mergedBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {entry.associationsCombined.contacts}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {entry.associationsCombined.deals}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <LifeBuoy className="h-3 w-3" />
                        {entry.associationsCombined.tickets}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--brand-dark)]">
                        <Activity className="h-3 w-3" />
                        {entry.associationsCombined.activities.toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {isExpanded && primary && (
                    <div className="px-5 pb-5 pl-16 bg-slate-50/50 border-t border-slate-100">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                            Surviving record
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900 text-sm">
                                {primary.properties.name}
                              </span>
                              <LifecycleBadge
                                stage={primary.properties.lifecyclestage}
                              />
                            </div>
                            <div className="text-xs text-slate-500">
                              {primary.properties.website_url || "—"} · Owner:{" "}
                              {primary.properties.company_owner || "—"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                              ID: {primary.id}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 mb-2">
                            Removed records (snapshot preserved)
                          </div>
                          <div className="space-y-2">
                            {merged.map((c) => (
                              <div
                                key={c.id}
                                className="bg-white border border-slate-200 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900 text-sm">
                                    {c.properties.name}
                                  </span>
                                  <LifecycleBadge
                                    stage={c.properties.lifecyclestage}
                                  />
                                </div>
                                <div className="text-xs text-slate-500">
                                  {c.properties.website_url || "—"} · Owner:{" "}
                                  {c.properties.company_owner || "—"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                                  ID: {c.id}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-[11px] text-slate-500 italic">
                        Pre-merge snapshot is retained in this audit entry
                        ({entry.snapshot.length} records,{" "}
                        {Math.round(JSON.stringify(entry.snapshot).length / 1024)}
                        KB).
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}
