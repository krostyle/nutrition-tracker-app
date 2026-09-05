import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const TAB_TINTS = {
  emerald:
    "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400",
  blue: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400",
  violet:
    "bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400",
  amber:
    "bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400",
} as const;

export type TabTint = keyof typeof TAB_TINTS;

export function TabIconBadge({
  tint,
  icon: Icon,
  className,
}: {
  tint: TabTint;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full",
        TAB_TINTS[tint],
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export const floatingTabListClass = "h-auto! gap-0.5 rounded-2xl p-1.5";

export const floatingTabTriggerClass =
  "h-auto! min-w-0 flex-1 flex-col gap-1 rounded-xl px-0.5 py-2 text-[10px] font-medium";

export const floatingTabLabelClass = "w-full truncate text-center";
