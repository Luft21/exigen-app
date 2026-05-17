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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHealthDistribution,
  getSisaUmurPerKategori,
  getMonthlyDamageFrequency,
} from "@/lib/data";

export function HealthDonutChart() {
  const data = getHealthDistribution();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm">Distribusi Status Kesehatan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-heading font-semibold ml-auto">
                  {d.value}/{total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SisaUmurBarChart() {
  const data = getSisaUmurPerKategori();

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm">Rata-rata Sisa Umur per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="kategori"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              label={{ value: "Hari", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="rataRata" fill="hsl(210 45% 43%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DamageFrequencyChart() {
  const data = getMonthlyDamageFrequency();

  return (
    <Card className="animate-fade-in-up col-span-full" style={{ animationDelay: "600ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm">Frekuensi Kerusakan per Bulan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="jumlah"
              name="Jumlah Kerusakan"
              stroke="hsl(210 53% 24%)"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(210 53% 24%)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
