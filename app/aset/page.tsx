import { AssetTable } from "@/components/asset-table";

export const metadata = {
  title: "Daftar Aset",
  description: "Daftar lengkap semua aset dengan filter dan sorting.",
};

export default function AsetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Daftar Aset</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola dan pantau seluruh aset beserta prediksi sisa umur.
        </p>
      </div>
      <AssetTable />
    </div>
  );
}
