"use client";

import type { ActivitySample } from "@/lib/types";
import { formatRelative, formatDateTime } from "@/lib/format";

type Align = "left" | "center" | "right";

type Props = {
  label: string;
  total: number;
  samples: ActivitySample[];
  align?: Align;
};

const ALIGN_CLASS: Record<Align, string> = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

export function ActivityPopover({
  label,
  total,
  samples,
  align = "center",
}: Props) {
  return (
    <div
      className={`absolute ${ALIGN_CLASS[align]} top-full pt-2 w-80 z-30 hidden group-hover:block group-focus-within:block`}
    >
      <div className="bg-white rounded-lg shadow-xl ring-1 ring-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Recent {label.toLowerCase()}
          </span>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {total.toLocaleString()} total
          </span>
        </div>
        {samples.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500 italic">
            No {label.toLowerCase()} on this record.
          </div>
        ) : (
          <ul className="popover-scroll divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {samples.map((s, i) => (
              <li key={i} className="px-3 py-2 hover:bg-slate-50">
                <div className="text-sm text-slate-900 leading-snug truncate">
                  {s.subject}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span title={formatDateTime(s.timestamp)}>
                    {formatRelative(s.timestamp)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="truncate">{s.owner}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {total > samples.length && (
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            + {(total - samples.length).toLocaleString()} more in HubSpot
          </div>
        )}
      </div>
    </div>
  );
}
