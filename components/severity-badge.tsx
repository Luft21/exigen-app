import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

const severityConfig: Record<string, { label: string; className: string; dotClassName: string }> = {
  Ringan: {
    label: "Ringan",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    dotClassName: "bg-emerald-500",
  },
  Sedang: {
    label: "Sedang",
    className: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    dotClassName: "bg-amber-500",
  },
  Berat: {
    label: "Berat",
    className: "bg-orange-50 text-orange-600 border-orange-200/50 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50",
    dotClassName: "bg-orange-500",
  },
  Tinggi: {
    label: "Tinggi",
    className: "bg-orange-50 text-orange-600 border-orange-200/50 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50",
    dotClassName: "bg-orange-500",
  },
  Fatal: {
    label: "Fatal",
    className: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
    dotClassName: "bg-rose-600 animate-pulse",
  },
  Kritis: {
    label: "Kritis",
    className: "bg-rose-50 text-rose-600 border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
    dotClassName: "bg-rose-600 animate-pulse",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  // Default fallback for unknown severities
  const config = severityConfig[severity] || {
    label: severity,
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    dotClassName: "bg-muted-foreground",
  };

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
        className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", config.dotClassName)}
      />
      {config.label}
    </Badge>
  );
}
