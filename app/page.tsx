import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { HealthDonutChart, SisaUmurBarChart, DamageFrequencyChart } from "@/components/charts";
import { masterAssets } from "@/lib/data";

export const metadata = {
  title: "Overview",
  description: "Dashboard overview prediksi umur aset dan early warning system.",
};

export default function OverviewPage() {
  // Show top critical assets
  const criticalAssets = [...masterAssets]
    .sort((a, b) => a.sisaUmurHari - b.sisaUmurHari)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthDonutChart />
        <SisaUmurBarChart />
      </div>

      {/* Damage Frequency */}
      <DamageFrequencyChart />

      {/* Critical Assets */}
      <div>
        <h3 className="font-heading text-sm font-semibold tracking-tight mb-3">
          Aset Perlu Perhatian Segera
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {criticalAssets.map((asset) => (
            <AssetHealthCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
