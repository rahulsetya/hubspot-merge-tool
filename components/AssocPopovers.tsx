"use client";

import {
  Mail,
  PhoneCall,
  Calendar,
  StickyNote,
  ListTodo,
} from "lucide-react";
import type {
  ContactSample,
  DealSample,
  MixedActivity,
  TicketSample,
} from "@/lib/sample-gen";
import { formatCurrency, formatRelative } from "@/lib/format";

type Align = "left" | "center" | "right";

const ALIGN_CLASS: Record<Align, string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

const WRAPPER_CLASS =
  "absolute top-full pt-2 w-80 z-30 hidden group-hover:block group-focus-within:block";

const STAGE_COLOR: Record<string, string> = {
  Discovery: "bg-sky-50 text-sky-700 ring-sky-200",
  Proposal: "bg-amber-50 text-amber-700 ring-amber-200",
  Negotiation: "bg-orange-50 text-orange-700 ring-orange-200",
  "Closed Won": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Closed Lost": "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_COLOR: Record<string, string> = {
  Open: "bg-rose-50 text-rose-700 ring-rose-200",
  "In progress": "bg-amber-50 text-amber-700 ring-amber-200",
  "Waiting on customer": "bg-violet-50 text-violet-700 ring-violet-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
};

function PopoverShell({
  align,
  title,
  total,
  children,
  emptyMsg,
  remaining,
}: {
  align: Align;
  title: string;
  total: number;
  children: React.ReactNode;
  emptyMsg: string;
  remaining: number;
}) {
  return (
    <div className={`${WRAPPER_CLASS} ${ALIGN_CLASS[align]}`}>
      <div className="bg-white rounded-lg shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {total.toLocaleString()} total
          </span>
        </div>
        {total === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500 italic">
            {emptyMsg}
          </div>
        ) : (
          <ul className="popover-scroll divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {children}
          </ul>
        )}
        {remaining > 0 && (
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            + {remaining.toLocaleString()} more in HubSpot
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactsPopover({
  contacts,
  total,
  align = "center",
}: {
  contacts: ContactSample[];
  total: number;
  align?: Align;
}) {
  return (
    <PopoverShell
      align={align}
      title="Contacts on this record"
      total={total}
      emptyMsg="No contacts on this record."
      remaining={total - contacts.length}
    >
      {contacts.map((c, i) => (
        <li key={i} className="px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-slate-900 leading-tight truncate">
              {c.name}
            </span>
            {c.isPrimary && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                Primary
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {c.jobTitle}
          </div>
          <div className="text-[11px] text-sky-700 mt-0.5 truncate">
            {c.email}
          </div>
        </li>
      ))}
    </PopoverShell>
  );
}

export function DealsPopover({
  deals,
  total,
  align = "center",
}: {
  deals: DealSample[];
  total: number;
  align?: Align;
}) {
  return (
    <PopoverShell
      align={align}
      title="Deals on this record"
      total={total}
      emptyMsg="No deals on this record."
      remaining={total - deals.length}
    >
      {deals.map((d, i) => (
        <li key={i} className="px-3 py-2">
          <div className="text-sm font-medium text-slate-900 leading-tight">
            {d.name}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1">
            <span className="text-slate-600">{d.pipeline}</span>
            <span className="text-slate-300">·</span>
            <span
              className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ${
                STAGE_COLOR[d.stage] ?? "bg-slate-100 text-slate-700 ring-slate-200"
              }`}
            >
              {d.stage}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <span className="text-[11px] text-slate-600 truncate">
              {d.owner}
            </span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
              {formatCurrency(d.amount)}
            </span>
          </div>
        </li>
      ))}
    </PopoverShell>
  );
}

export function TicketsPopover({
  tickets,
  total,
  align = "center",
}: {
  tickets: TicketSample[];
  total: number;
  align?: Align;
}) {
  return (
    <PopoverShell
      align={align}
      title="Tickets on this record"
      total={total}
      emptyMsg="No tickets on this record."
      remaining={total - tickets.length}
    >
      {tickets.map((t, i) => (
        <li key={i} className="px-3 py-2">
          <div className="text-sm text-slate-900 leading-tight">
            {t.subject}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ${
                STATUS_COLOR[t.status] ??
                "bg-slate-100 text-slate-700 ring-slate-200"
              }`}
            >
              {t.status}
            </span>
            <span
              className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ${
                PRIORITY_COLOR[t.priority] ??
                "bg-slate-100 text-slate-700 ring-slate-200"
              }`}
            >
              {t.priority}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              {t.owner}
            </span>
          </div>
        </li>
      ))}
    </PopoverShell>
  );
}

const CHANNEL_META: Record<
  MixedActivity["channel"],
  { icon: React.ElementType; label: string; color: string }
> = {
  emails: { icon: Mail, label: "Email", color: "text-sky-600" },
  calls: { icon: PhoneCall, label: "Call", color: "text-violet-600" },
  meetings: { icon: Calendar, label: "Meeting", color: "text-emerald-600" },
  notes: { icon: StickyNote, label: "Note", color: "text-amber-600" },
  tasks: { icon: ListTodo, label: "Task", color: "text-rose-600" },
};

export function RecentActivityPopover({
  activities,
  total,
  align = "right",
}: {
  activities: MixedActivity[];
  total: number;
  align?: Align;
}) {
  return (
    <PopoverShell
      align={align}
      title="Recent activity"
      total={total}
      emptyMsg="No activity on this record."
      remaining={total - activities.length}
    >
      {activities.map((a, i) => {
        const meta = CHANNEL_META[a.channel];
        const Icon = meta.icon;
        return (
          <li key={i} className="px-3 py-2">
            <div className="flex items-start gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-900 leading-tight truncate">
                  {a.subject}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className="font-medium">{meta.label}</span>
                  <span className="text-slate-300">·</span>
                  <span>{formatRelative(a.timestamp)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="truncate">{a.owner}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </PopoverShell>
  );
}
