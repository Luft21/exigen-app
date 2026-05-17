"use client";

import type { AssetStatus } from "@/lib/data";

interface HealthGaugeProps {
  sisaUmurHari: number;
  maxUmur?: number;
  status: AssetStatus;
  size?: number;
}

const statusColors: Record<AssetStatus, { stroke: string; text: string }> = {
  Healthy: { stroke: "hsl(152 60% 40%)", text: "text-success" },
  Watch: { stroke: "hsl(210 45% 43%)", text: "text-watch" },
  Warning: { stroke: "hsl(38 92% 50%)", text: "text-warning" },
  Critical: { stroke: "hsl(0 72% 51%)", text: "text-destructive" },
};

export function HealthGauge({
  sisaUmurHari,
  maxUmur = 365,
  status,
  size = 120,
}: HealthGaugeProps) {
  const pct = Math.min(sisaUmurHari / maxUmur, 1);
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - pct * c;
  const colors = statusColors[status];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="rotate-[-90deg]" width={size} height={size}>
        {/* Background circle */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="animate-gauge-fill transition-all duration-1000"
          style={{ "--gauge-target": offset } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-heading text-2xl font-bold ${colors.text}`}>
          {sisaUmurHari}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          hari
        </span>
      </div>
    </div>
  );
}
