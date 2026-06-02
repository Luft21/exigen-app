import { Badge } from "@/components/ui/badge";
import type { AssetStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  Healthy: {
    label: "Healthy",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 hover:bg-emerald-100/50",
  },
  Watch: {
    label: "Watch",
    className: "bg-cyan-50 text-cyan-600 border-cyan-200/50 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800/50 hover:bg-cyan-100/50",
  },
  Warning: {
    label: "Warning",
    className: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50 hover:bg-amber-100/50",
  },
  Critical: {
    label: "Critical",
    className: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50 hover:bg-rose-100/50",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-heading text-[10px] uppercase tracking-wider border",
        config.className,
        className
      )}
    >
      <span
        className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": status === "Healthy",
          "bg-cyan-500": status === "Watch",
          "bg-amber-500": status === "Warning",
          "bg-rose-600 animate-pulse": status === "Critical",
        })}
      />
      {config.label}
    </Badge>
  );
}
