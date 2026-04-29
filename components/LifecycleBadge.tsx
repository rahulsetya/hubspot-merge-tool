import type { LifecycleStage } from "@/lib/types";
import { lifecycleColor, lifecycleLabel } from "@/lib/format";

export function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ring-1 ${lifecycleColor(
        stage
      )}`}
    >
      {lifecycleLabel(stage)}
    </span>
  );
}
