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
    className: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  },
  Watch: {
    label: "Watch",
    className: "bg-watch/15 text-watch border-watch/30 hover:bg-watch/20",
  },
  Warning: {
    label: "Warning",
    className: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20",
  },
  Critical: {
    label: "Critical",
    className: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
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
          "bg-success": status === "Healthy",
          "bg-watch": status === "Watch",
          "bg-warning": status === "Warning",
          "bg-destructive animate-pulse": status === "Critical",
        })}
      />
      {config.label}
    </Badge>
  );
}
