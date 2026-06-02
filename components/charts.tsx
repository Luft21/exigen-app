"use client";

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
      <div className="bg-card shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05)] border-0 rounded-lg p-3 text-xs">
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

export function HealthDonutChart({ data }: { data: { name: string, value: number, fill: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm text-foreground/80">Distribusi Status Kesehatan</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 xl:gap-12">
          <ResponsiveContainer width={220} height={220}>
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
                innerRadius={75}
                outerRadius={105}
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
          <div className="flex flex-col gap-4 flex-1 justify-center w-full min-w-[160px]">
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
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.6} />
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

export function DamageFrequencyChart({ data }: { data: any[] }) {
  return (
    <Card className="animate-fade-in-up col-span-full" style={{ animationDelay: "600ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm text-foreground/80">Tren Frekuensi Kerusakan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
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
              dataKey="jumlah"
              name="Kerusakan"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#areaGradient)"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

