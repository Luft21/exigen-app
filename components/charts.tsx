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

export function DamageFrequencyChart({ data, height = 220 }: { data: any[], height?: number }) {
  const processedData = data.map((d, i) => {
    const isLast = i === data.length - 1;
    const isSecondLast = i === data.length - 2;
    return {
      ...d,
      jumlahReal: isLast ? undefined : d.jumlah,
      jumlahEstimasi: isLast || isSecondLast ? d.jumlah : undefined,
    };
  });

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "600ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm text-foreground/80">Tren Frekuensi Kerusakan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dx={-10}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="jumlahReal"
              name="Kerusakan"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#areaGradient)"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
            />
            <Area
              type="monotone"
              dataKey="jumlahEstimasi"
              name="Estimasi Berjalan"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeDasharray="5 5"
              fill="none"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LocationDamageChart({ rawData, height = 220 }: { rawData: { tanggal: string; lokasi: string }[], height?: number }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    rawData.forEach(d => {
      map[d.lokasi] = (map[d.lokasi] || 0) + 1;
    });
    return Object.entries(map)
      .map(([lokasi, jumlah]) => ({ lokasi, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
  }, [rawData]);

  return (
    <Card className="animate-fade-in-up bg-primary text-primary-foreground border-none" style={{ animationDelay: "700ms" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-heading text-sm text-primary-foreground font-semibold">Lokasi Kerusakan Terbanyak</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="locGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.2)" strokeOpacity={0.8} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.8)" }}
              axisLine={false}
              tickLine={false}
              dx={0}
              allowDecimals={false}
            />
            <YAxis
              dataKey="lokasi"
              type="category"
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.9)" }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} content={<CustomTooltip />} />
            <Bar 
              dataKey="jumlah" 
              fill="url(#locGradient)" 
              radius={[0, 4, 4, 0]} 
              barSize={20} 
              className="transition-opacity hover:opacity-90"
              activeBar={{ fill: '#ffffff', stroke: '#e0e7ff', strokeWidth: 1 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

