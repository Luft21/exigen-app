"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  Label,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card shadow-lg border border-border/50 rounded-lg p-3 text-xs z-50 relative">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color || p.fill }}
            />
            <span className="text-muted-foreground">{p.name || p.dataKey}:</span>
            <span className="font-heading font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function HealthDonutChart({ data, large = false }: { data: { name: string, value: number, fill: string }[], large?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  
  const chartSize = large ? 320 : 220;
  const innerR = large ? 110 : 75;
  const outerR = large ? 150 : 105;

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm text-foreground/80">Distribusi Status Kesehatan</CardTitle>
      </CardHeader>
      <CardContent className={`p-6 flex flex-col justify-center h-full ${large ? 'py-10' : ''}`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 xl:gap-24 w-full">
          <div className="shrink-0">
            <ResponsiveContainer width={chartSize} height={chartSize}>
            <PieChart>
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.05" />
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerR}
                outerRadius={outerR}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
                style={{ filter: 'url(#shadow)' }}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} className="hover:opacity-80 transition-opacity duration-300 outline-none" />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox as any;
                    return (
                      <text x={cx} y={cy} fill="hsl(var(--foreground))" className="font-heading font-bold" textAnchor="middle" dominantBaseline="central">
                        <tspan x={cx} y={cy} dy="-4" fontSize="32">{total}</tspan>
                        <tspan x={cx} y={cy} dy="24" fontSize="12" fill="hsl(var(--muted-foreground))">Total Aset</tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-6 justify-center min-w-[240px]">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-3 text-sm sm:text-base group">
                <span
                  className="h-4 w-4 rounded-full shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">{d.name}</span>
                <span className="font-heading font-bold ml-auto text-foreground/90 text-base sm:text-lg">
                  {d.value} <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">/ {total}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SisaUmurBarChart({ data }: { data: any[] }) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm text-foreground/80">Top 10 Kategori Sisa Umur Terpendek</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" barSize={24} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" strokeOpacity={0.8} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dx={0}
            />
            <YAxis
              dataKey="kategori"
              type="category"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.3)' }} content={<CustomTooltip />} />
            <Bar dataKey="rataRata" fill="url(#barGradient)" radius={[0, 4, 4, 0]} className="hover:opacity-80 transition-opacity" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const formatCost = (value: number) => {
  if (value >= 1e9) {
    return `Rp ${(value / 1e9).toFixed(1)} M`;
  }
  if (value >= 1e6) {
    return `Rp ${(value / 1e6).toFixed(0)} Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const CostTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isProj = data.isProjection;
    const maint = isProj ? data.maintenanceProjected : data.maintenanceActual;
    const repl = isProj ? data.replacementProjected : data.replacementActual;
    const total = (maint || 0) + (repl || 0);

    return (
      <div className="bg-card shadow-lg border border-border/50 rounded-lg p-3 text-xs z-50">
        <p className="font-bold text-foreground mb-1">
          {label} {isProj && <span className="text-[9px] text-warning font-heading font-extrabold ml-1 px-1.5 py-0.5 rounded-full bg-warning/15 uppercase tracking-wider">Proyeksi</span>}
        </p>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Pemeliharaan:</span>
            <span className="font-bold ml-auto">{formatCost(maint || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Penggantian:</span>
            <span className="font-bold ml-auto">{formatCost(repl || 0)}</span>
          </div>
          <div className="border-t border-border/50 pt-1.5 mt-1.5 font-bold flex text-foreground">
            <span>Total Anggaran:</span>
            <span className="ml-auto">{formatCost(total)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CostTrendChart({ data, height = 300 }: { data: any[], height?: number }) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "600ms" }}>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-sm text-foreground/80">Tren Anggaran Pemeliharaan vs Penggantian (Aktual vs Proyeksi Model)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualMaintGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="projMaintGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="actualReplGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="projReplGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dx={-5}
              tickFormatter={(v) => formatCost(v)}
            />
            <Tooltip content={<CostTooltip />} />
            
            {/* Draw vertical line today (Jun 26) */}
            <ReferenceLine 
              x="Jun 26" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              label={{ 
                value: 'HARI INI', 
                position: 'top', 
                fill: 'hsl(var(--foreground))', 
                fontSize: 9, 
                fontWeight: 'bold',
                fontFamily: 'var(--font-heading)'
              }} 
            />

            {/* Actual Areas */}
            <Area
              type="monotone"
              dataKey="maintenanceActual"
              stackId="a"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#actualMaintGrad)"
              name="Pemeliharaan (Aktual)"
              connectNulls={true}
            />
            <Area
              type="monotone"
              dataKey="replacementActual"
              stackId="a"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#actualReplGrad)"
              name="Penggantian (Aktual)"
              connectNulls={true}
            />

            {/* Projected Areas */}
            <Area
              type="monotone"
              dataKey="maintenanceProjected"
              stackId="b"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#projMaintGrad)"
              name="Pemeliharaan (Proyeksi)"
              connectNulls={true}
            />
            <Area
              type="monotone"
              dataKey="replacementProjected"
              stackId="b"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#projReplGrad)"
              name="Penggantian (Proyeksi)"
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function HeatmapGedungLantai({ data }: { data: any[] }) {
  const map = useMemo(() => {
    const lookup = new Map<string, { total: number, critical: number }>();
    data.forEach(d => {
      lookup.set(`${d.lokasiGedung}|${d.lokasiLantai}`, { total: d.total, critical: d.critical });
    });
    return lookup;
  }, [data]);

  const buildings = ['Gedung Utama', 'Gedung A', 'Gedung B', 'Gedung C', 'Gedung D', 'Gedung E', 'Gedung Parkir', 'Gedung Servis'];
  const buildingShorts: Record<string, string> = {
    'Gedung Utama': 'Utama',
    'Gedung A': 'Ged A',
    'Gedung B': 'Ged B',
    'Gedung C': 'Ged C',
    'Gedung D': 'Ged D',
    'Gedung E': 'Ged E',
    'Gedung Parkir': 'Parkir',
    'Gedung Servis': 'Servis'
  };

  const floors = Array.from({ length: 20 }, (_, i) => String(20 - i));

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "700ms" }}>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-sm text-foreground/80">Heatmap Aset Kritis Spasial (Gedung &times; Lantai)</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto select-none">
          <div className="min-w-[500px] flex flex-col">
            <div className="flex mb-1.5">
              <div className="w-10 text-[9px] font-bold text-muted-foreground uppercase flex items-center justify-center shrink-0">
                Lantai
              </div>
              <div className="flex-1 grid grid-cols-8 gap-1">
                {buildings.map(b => (
                  <div key={b} className="text-[10px] font-extrabold text-muted-foreground text-center truncate px-1 uppercase tracking-wider">
                    {buildingShorts[b]}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {floors.map(floor => (
                <div key={floor} className="flex h-5">
                  <div className="w-10 text-[9px] font-extrabold text-muted-foreground flex items-center justify-center shrink-0">
                    Lt. {floor}
                  </div>
                  <div className="flex-1 grid grid-cols-8 gap-1">
                    {buildings.map(building => {
                      const cellData = map.get(`${building}|${floor}`);
                      const total = cellData?.total || 0;
                      const critical = cellData?.critical || 0;

                      let bgClass = "bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/20 dark:border-slate-800/20";
                      let titleText = `${building}, Lantai ${floor}: Tidak ada aset`;

                      if (total > 0) {
                        if (critical === 0) {
                          bgClass = "bg-emerald-500/80 dark:bg-emerald-600/80 text-white border border-emerald-600/20 hover:scale-105 transition-transform cursor-pointer";
                          titleText = `${building}, Lantai ${floor}:\nTotal Aset: ${total}\n0 Aset Kritis (Aman)`;
                        } else if (critical <= 5) {
                          bgClass = "bg-amber-400 dark:bg-amber-500 text-slate-950 border border-amber-500/20 hover:scale-105 transition-transform cursor-pointer font-extrabold";
                          titleText = `${building}, Lantai ${floor}:\nTotal Aset: ${total}\n${critical} Aset Kritis (Tindakan Segera)`;
                        } else if (critical <= 15) {
                          bgClass = "bg-orange-500 text-white border border-orange-600/20 hover:scale-105 transition-transform cursor-pointer font-extrabold";
                          titleText = `${building}, Lantai ${floor}:\nTotal Aset: ${total}\n${critical} Aset Kritis (Urgensi Tinggi)`;
                        } else {
                          bgClass = "bg-rose-700 text-white border border-rose-800/20 hover:scale-105 transition-transform cursor-pointer font-extrabold";
                          titleText = `${building}, Lantai ${floor}:\nTotal Aset: ${total}\n${critical} Aset Kritis (Urgensi Kritis)`;
                        }
                      }

                      return (
                        <div
                          key={building}
                          className={`rounded text-[9px] font-bold flex items-center justify-center transition-all ${bgClass}`}
                          title={titleText}
                        >
                          {critical > 0 ? critical : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/50" />
            <span className="text-[9px]">Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 dark:bg-emerald-600/80" />
            <span className="text-[9px]">Aman (0 Kritis)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 dark:bg-amber-500" />
            <span className="text-[9px]">Kritis (1-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-[9px]">Urgensi (6-15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-700" />
            <span className="text-[9px]">Bahaya (&gt;15)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryRULBarChart({ data, height = 400 }: { data: any[], height?: number }) {
  const chartData = useMemo(() => {
    return data.map(c => {
      const total = c.total || 1;
      return {
        kategori: c.kategori,
        kritis: (c.kritis / total) * 100,
        kritisCount: c.kritis,
        perhatian: (c.perhatian / total) * 100,
        perhatianCount: c.perhatian,
        monitor: (c.monitor / total) * 100,
        monitorCount: c.monitor,
        sehat: (c.sehat / total) * 100,
        sehatCount: c.sehat,
        totalCount: c.total
      };
    }).sort((a, b) => b.totalCount - a.totalCount).slice(0, 8); // Top 8 categories
  }, [data]);

  const CustomRULTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card shadow-lg border border-border/50 rounded-lg p-3 text-xs z-50">
          <p className="font-bold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-700" />
              <span className="text-muted-foreground text-[10px]">Tindakan segera (&lt;7 hr):</span>
              <span className="font-bold text-rose-700 ml-auto">{item.kritisCount} ({item.kritis.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground text-[10px]">Perlu direncanakan (7-30 hr):</span>
              <span className="font-bold text-warning-foreground ml-auto">{item.perhatianCount} ({item.perhatian.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground text-[10px]">Pantau (30-90 hr):</span>
              <span className="font-bold text-blue-500 ml-auto">{item.monitorCount} ({item.monitor.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground text-[10px]">Aman (&gt;90 hr):</span>
              <span className="font-bold text-emerald-500 ml-auto">{item.sehatCount} ({item.sehat.toFixed(1)}%)</span>
            </div>
            <div className="border-t border-border/50 pt-1.5 mt-1.5 font-bold flex text-foreground">
              <span>Total Aset Kategori:</span>
              <span className="ml-auto">{item.totalCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "800ms" }}>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-sm text-foreground/80">Distribusi Kategori RUL (100% Stacked Bar)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical" barSize={16} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              dataKey="kategori"
              type="category"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomRULTooltip />} />
            
            {/* Using colors consistent with Hero sisaUmur buckets */}
            <Bar dataKey="kritis" stackId="a" fill="var(--color-destructive)" name="Kritis" radius={[2, 0, 0, 2]} />
            <Bar dataKey="perhatian" stackId="a" fill="var(--color-warning)" name="Perhatian" />
            <Bar dataKey="monitor" stackId="a" fill="var(--color-watch)" name="Monitor" />
            <Bar dataKey="sehat" stackId="a" fill="var(--color-success)" name="Sehat" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


