"use client";

interface SparklineProps {
  variant: "kritis" | "perhatian" | "monitor" | "sehat";
  width?: number | string;
  height?: number;
}

export function Sparkline({ variant, width = 120, height = 32 }: SparklineProps) {
  // Pre-defined smooth bezier curves that reflect trends visually matching the design mockup
  const configs = {
    kritis: {
      stroke: "var(--color-destructive)",
      gradient: "grad-kritis",
      // Rising line from left to right (increasing criticality)
      d: "M 0 26 C 20 24, 40 28, 60 18 C 80 10, 100 12, 120 4",
    },
    perhatian: {
      stroke: "var(--color-warning)",
      gradient: "grad-perhatian",
      // Slightly fluctuating/stable warning trend
      d: "M 0 20 C 20 22, 40 17, 60 23 C 80 25, 100 21, 120 24",
    },
    monitor: {
      stroke: "var(--color-watch)",
      gradient: "grad-monitor",
      // Calm, wavy line
      d: "M 0 22 C 20 20, 40 25, 60 21 C 80 23, 100 18, 120 20",
    },
    sehat: {
      stroke: "var(--color-success)",
      gradient: "grad-sehat",
      // Steady, healthy, slightly wavy line
      d: "M 0 16 C 20 16, 40 14, 60 17 C 80 15, 100 18, 120 16",
    },
  };

  const current = configs[variant] || configs.sehat;
  const fillD = `${current.d} L 120 ${height} L 0 ${height} Z`;

  return (
    <div className="shrink-0 flex items-end">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 120 ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-75 group-hover:opacity-100 transition-opacity duration-300"
      >
        <defs>
          <linearGradient id={current.gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={current.stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={current.stroke} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {/* Shadow area gradient */}
        <path d={fillD} fill={`url(#${current.gradient})`} />
        {/* Smooth trendline */}
        <path
          d={current.d}
          stroke={current.stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
