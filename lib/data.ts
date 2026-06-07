// ============================================================
// Dummy data for Exigen Asset Health Dashboard
// ============================================================

export type AssetStatus = "Healthy" | "Watch" | "Warning" | "Critical";
export type Severity = "Ringan" | "Sedang" | "Berat" | "Kritis";
export type Criticality = "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export interface MasterAsset {
  id: string;
  nama: string;
  merek: string;
  model: string;
  kategori: string;
  subKategori: string;
  tipe: string;
  tanggalInstalasi: string;
  lokasiGedung: string;
  lokasiLantai: string;
  lokasiZona: string;
  tingkatKekritisan: Criticality;
  status: "Aktif" | "Non-Aktif" | "Dalam Perbaikan";
  sisaUmurHari: number;
  estimasiPenggantian: string;
  healthStatus: AssetStatus;
}

export interface AssetComplaint {
  id: string;
  idAset: string;
  namaAset: string;
  kategori: string;
  subKategori: string;
  tipe: string;
  tanggalPerencanaan: string;
  tanggalPengerjaan: string;
  tanggalSelesai: string;
  jenisKerusakan: string;
  severity: Severity;
  penyebab: string;
  biayaPerbaikan: number;
  sparePartDigunakan: string;
  teknisiPelaksana: string;
}

export interface ReplacementHistory {
  idAsetLama: string;
  namaAsetLama: string;
  kategori: string;
  tipe: string;
  idAsetBaru: string;
  tanggalPenggantian: string;
  alasanPenggantian: string;
  biayaPenggantian: number;
}

export interface FrequencyPlan {
  kategori: string;
  subKategori: string;
  tipe: string;
  frekuensi: string;
}

// --- Helper ---
function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const today = new Date("2026-05-17");

// --- Master Assets ---
export const masterAssets: MasterAsset[] = [
  { id: "AST-001", nama: "Chiller Utama", merek: "Daikin", model: "EWAD-B", kategori: "HVAC", subKategori: "Pendingin", tipe: "Chiller", tanggalInstalasi: "2019-03-15", lokasiGedung: "Gedung A", lokasiLantai: "Basement", lokasiZona: "Zona Mekanikal", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 12, estimasiPenggantian: addDays(today, 12), healthStatus: "Critical" },
  { id: "AST-002", nama: "AHU Lantai 3", merek: "Carrier", model: "39HQ", kategori: "HVAC", subKategori: "Air Handler", tipe: "AHU", tanggalInstalasi: "2020-06-10", lokasiGedung: "Gedung A", lokasiLantai: "Lantai 3", lokasiZona: "Zona Utara", tingkatKekritisan: "Tinggi", status: "Aktif", sisaUmurHari: 45, estimasiPenggantian: addDays(today, 45), healthStatus: "Warning" },
  { id: "AST-003", nama: "Genset Cadangan", merek: "Cummins", model: "QSK60", kategori: "Listrik", subKategori: "Generator", tipe: "Genset", tanggalInstalasi: "2018-01-20", lokasiGedung: "Gedung B", lokasiLantai: "Basement", lokasiZona: "Zona Mekanikal", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 25, estimasiPenggantian: addDays(today, 25), healthStatus: "Warning" },
  { id: "AST-004", nama: "Lift Penumpang 1", merek: "Schindler", model: "S5500", kategori: "Transportasi", subKategori: "Elevator", tipe: "Lift Penumpang", tanggalInstalasi: "2021-09-05", lokasiGedung: "Gedung A", lokasiLantai: "Semua", lokasiZona: "Zona Tengah", tingkatKekritisan: "Tinggi", status: "Aktif", sisaUmurHari: 180, estimasiPenggantian: addDays(today, 180), healthStatus: "Healthy" },
  { id: "AST-005", nama: "Pompa Air Utama", merek: "Grundfos", model: "CR 45", kategori: "Plumbing", subKategori: "Pompa", tipe: "Centrifugal", tanggalInstalasi: "2020-02-14", lokasiGedung: "Gedung A", lokasiLantai: "Basement", lokasiZona: "Zona Mekanikal", tingkatKekritisan: "Tinggi", status: "Dalam Perbaikan", sisaUmurHari: 8, estimasiPenggantian: addDays(today, 8), healthStatus: "Critical" },
  { id: "AST-006", nama: "Panel Listrik Utama", merek: "Schneider", model: "Prisma P", kategori: "Listrik", subKategori: "Panel", tipe: "MDP", tanggalInstalasi: "2019-07-22", lokasiGedung: "Gedung B", lokasiLantai: "Lantai 1", lokasiZona: "Zona Mekanikal", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 90, estimasiPenggantian: addDays(today, 90), healthStatus: "Watch" },
  { id: "AST-007", nama: "CCTV Lobby", merek: "Hikvision", model: "DS-2CD", kategori: "Keamanan", subKategori: "CCTV", tipe: "IP Camera", tanggalInstalasi: "2022-11-01", lokasiGedung: "Gedung A", lokasiLantai: "Lantai 1", lokasiZona: "Zona Lobby", tingkatKekritisan: "Sedang", status: "Aktif", sisaUmurHari: 365, estimasiPenggantian: addDays(today, 365), healthStatus: "Healthy" },
  { id: "AST-008", nama: "Fire Alarm Panel", merek: "Notifier", model: "NFS2-3030", kategori: "Keamanan", subKategori: "Fire System", tipe: "Panel Alarm", tanggalInstalasi: "2020-04-18", lokasiGedung: "Gedung A", lokasiLantai: "Lantai 1", lokasiZona: "Zona Lobby", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 200, estimasiPenggantian: addDays(today, 200), healthStatus: "Healthy" },
  { id: "AST-009", nama: "AC Split Ruang Server", merek: "Daikin", model: "FTKC60", kategori: "HVAC", subKategori: "AC Split", tipe: "Split Wall", tanggalInstalasi: "2023-01-10", lokasiGedung: "Gedung B", lokasiLantai: "Lantai 2", lokasiZona: "Zona Server", tingkatKekritisan: "Tinggi", status: "Aktif", sisaUmurHari: 60, estimasiPenggantian: addDays(today, 60), healthStatus: "Watch" },
  { id: "AST-010", nama: "UPS Server Room", merek: "APC", model: "Smart-UPS", kategori: "Listrik", subKategori: "UPS", tipe: "Online", tanggalInstalasi: "2021-05-30", lokasiGedung: "Gedung B", lokasiLantai: "Lantai 2", lokasiZona: "Zona Server", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 150, estimasiPenggantian: addDays(today, 150), healthStatus: "Healthy" },
  { id: "AST-011", nama: "Escalator Utama", merek: "Otis", model: "506NCE", kategori: "Transportasi", subKategori: "Eskalator", tipe: "Eskalator", tanggalInstalasi: "2019-12-01", lokasiGedung: "Gedung A", lokasiLantai: "Lantai 1", lokasiZona: "Zona Lobby", tingkatKekritisan: "Tinggi", status: "Aktif", sisaUmurHari: 28, estimasiPenggantian: addDays(today, 28), healthStatus: "Warning" },
  { id: "AST-012", nama: "Pompa Hydrant", merek: "Ebara", model: "FSA 100", kategori: "Plumbing", subKategori: "Pompa", tipe: "Fire Pump", tanggalInstalasi: "2020-08-25", lokasiGedung: "Gedung A", lokasiLantai: "Basement", lokasiZona: "Zona Mekanikal", tingkatKekritisan: "Sangat Tinggi", status: "Aktif", sisaUmurHari: 120, estimasiPenggantian: addDays(today, 120), healthStatus: "Healthy" },
];

// --- Asset Complaints ---
export const assetComplaints: AssetComplaint[] = [
  { id: "CMP-001", idAset: "AST-001", namaAset: "Chiller Utama", kategori: "HVAC", subKategori: "Pendingin", tipe: "Chiller", tanggalPerencanaan: "2026-01-10", tanggalPengerjaan: "2026-01-12", tanggalSelesai: "2026-01-14", jenisKerusakan: "Kebocoran Refrigerant", severity: "Berat", penyebab: "Korosi pipa", biayaPerbaikan: 15000000, sparePartDigunakan: "Copper pipe, Refrigerant R410A", teknisiPelaksana: "Ahmad Surya" },
  { id: "CMP-002", idAset: "AST-001", namaAset: "Chiller Utama", kategori: "HVAC", subKategori: "Pendingin", tipe: "Chiller", tanggalPerencanaan: "2025-08-05", tanggalPengerjaan: "2025-08-06", tanggalSelesai: "2025-08-08", jenisKerusakan: "Compressor Overheat", severity: "Kritis", penyebab: "Bearing aus", biayaPerbaikan: 45000000, sparePartDigunakan: "Compressor bearing set", teknisiPelaksana: "Budi Hartono" },
  { id: "CMP-003", idAset: "AST-002", namaAset: "AHU Lantai 3", kategori: "HVAC", subKategori: "Air Handler", tipe: "AHU", tanggalPerencanaan: "2026-02-20", tanggalPengerjaan: "2026-02-21", tanggalSelesai: "2026-02-22", jenisKerusakan: "Filter Tersumbat", severity: "Sedang", penyebab: "Akumulasi debu", biayaPerbaikan: 2500000, sparePartDigunakan: "HEPA Filter", teknisiPelaksana: "Cahya Pratama" },
  { id: "CMP-004", idAset: "AST-003", namaAset: "Genset Cadangan", kategori: "Listrik", subKategori: "Generator", tipe: "Genset", tanggalPerencanaan: "2026-03-01", tanggalPengerjaan: "2026-03-02", tanggalSelesai: "2026-03-05", jenisKerusakan: "Fuel Injector Rusak", severity: "Berat", penyebab: "Kontaminasi bahan bakar", biayaPerbaikan: 25000000, sparePartDigunakan: "Fuel injector set", teknisiPelaksana: "Dedi Kurniawan" },
  { id: "CMP-005", idAset: "AST-005", namaAset: "Pompa Air Utama", kategori: "Plumbing", subKategori: "Pompa", tipe: "Centrifugal", tanggalPerencanaan: "2026-04-15", tanggalPengerjaan: "2026-04-16", tanggalSelesai: "2026-04-20", jenisKerusakan: "Seal Bocor", severity: "Berat", penyebab: "Mechanical seal aus", biayaPerbaikan: 8000000, sparePartDigunakan: "Mechanical seal kit", teknisiPelaksana: "Ahmad Surya" },
  { id: "CMP-006", idAset: "AST-005", namaAset: "Pompa Air Utama", kategori: "Plumbing", subKategori: "Pompa", tipe: "Centrifugal", tanggalPerencanaan: "2025-12-10", tanggalPengerjaan: "2025-12-11", tanggalSelesai: "2025-12-12", jenisKerusakan: "Impeller Aus", severity: "Sedang", penyebab: "Kavitasi", biayaPerbaikan: 12000000, sparePartDigunakan: "Impeller, O-ring set", teknisiPelaksana: "Budi Hartono" },
  { id: "CMP-007", idAset: "AST-006", namaAset: "Panel Listrik Utama", kategori: "Listrik", subKategori: "Panel", tipe: "MDP", tanggalPerencanaan: "2026-01-25", tanggalPengerjaan: "2026-01-26", tanggalSelesai: "2026-01-26", jenisKerusakan: "Busbar Overheat", severity: "Kritis", penyebab: "Koneksi longgar", biayaPerbaikan: 18000000, sparePartDigunakan: "Busbar connector, thermal paste", teknisiPelaksana: "Eka Firmansyah" },
  { id: "CMP-008", idAset: "AST-009", namaAset: "AC Split Ruang Server", kategori: "HVAC", subKategori: "AC Split", tipe: "Split Wall", tanggalPerencanaan: "2026-03-20", tanggalPengerjaan: "2026-03-21", tanggalSelesai: "2026-03-21", jenisKerusakan: "PCB Error", severity: "Sedang", penyebab: "Voltage spike", biayaPerbaikan: 3500000, sparePartDigunakan: "PCB main unit", teknisiPelaksana: "Cahya Pratama" },
  { id: "CMP-009", idAset: "AST-011", namaAset: "Escalator Utama", kategori: "Transportasi", subKategori: "Eskalator", tipe: "Eskalator", tanggalPerencanaan: "2026-04-01", tanggalPengerjaan: "2026-04-02", tanggalSelesai: "2026-04-05", jenisKerusakan: "Chain Stretch", severity: "Berat", penyebab: "Beban berlebih & usia", biayaPerbaikan: 35000000, sparePartDigunakan: "Drive chain, sprocket set", teknisiPelaksana: "Dedi Kurniawan" },
  { id: "CMP-010", idAset: "AST-004", namaAset: "Lift Penumpang 1", kategori: "Transportasi", subKategori: "Elevator", tipe: "Lift Penumpang", tanggalPerencanaan: "2026-02-10", tanggalPengerjaan: "2026-02-11", tanggalSelesai: "2026-02-11", jenisKerusakan: "Sensor Pintu Error", severity: "Ringan", penyebab: "Debu pada sensor", biayaPerbaikan: 500000, sparePartDigunakan: "Door sensor", teknisiPelaksana: "Eka Firmansyah" },
];

// --- Replacement History ---
export const replacementHistory: ReplacementHistory[] = [
  { idAsetLama: "AST-OLD-001", namaAsetLama: "Chiller Lama Gedung A", kategori: "HVAC", tipe: "Chiller", idAsetBaru: "AST-001", tanggalPenggantian: "2019-03-15", alasanPenggantian: "Usia melebihi batas ekonomis", biayaPenggantian: 850000000 },
  { idAsetLama: "AST-OLD-005", namaAsetLama: "Pompa Grundfos Lama", kategori: "Plumbing", tipe: "Centrifugal", idAsetBaru: "AST-005", tanggalPenggantian: "2020-02-14", alasanPenggantian: "Kerusakan berulang, efisiensi menurun", biayaPenggantian: 120000000 },
  { idAsetLama: "AST-OLD-003", namaAsetLama: "Genset Caterpillar", kategori: "Listrik", tipe: "Genset", idAsetBaru: "AST-003", tanggalPenggantian: "2018-01-20", alasanPenggantian: "Kapasitas tidak mencukupi", biayaPenggantian: 1200000000 },
  { idAsetLama: "AST-OLD-011", namaAsetLama: "Eskalator Hitachi", kategori: "Transportasi", tipe: "Eskalator", idAsetBaru: "AST-011", tanggalPenggantian: "2019-12-01", alasanPenggantian: "Safety compliance", biayaPenggantian: 650000000 },
];

// --- Frequency Plans ---
export const frequencyPlans: FrequencyPlan[] = [
  { kategori: "HVAC", subKategori: "Pendingin", tipe: "Chiller", frekuensi: "Bulanan" },
  { kategori: "HVAC", subKategori: "Air Handler", tipe: "AHU", frekuensi: "3 Bulanan" },
  { kategori: "HVAC", subKategori: "AC Split", tipe: "Split Wall", frekuensi: "3 Bulanan" },
  { kategori: "Listrik", subKategori: "Generator", tipe: "Genset", frekuensi: "Bulanan" },
  { kategori: "Listrik", subKategori: "Panel", tipe: "MDP", frekuensi: "6 Bulanan" },
  { kategori: "Listrik", subKategori: "UPS", tipe: "Online", frekuensi: "3 Bulanan" },
  { kategori: "Transportasi", subKategori: "Elevator", tipe: "Lift Penumpang", frekuensi: "Bulanan" },
  { kategori: "Transportasi", subKategori: "Eskalator", tipe: "Eskalator", frekuensi: "Bulanan" },
  { kategori: "Plumbing", subKategori: "Pompa", tipe: "Centrifugal", frekuensi: "3 Bulanan" },
  { kategori: "Plumbing", subKategori: "Pompa", tipe: "Fire Pump", frekuensi: "Bulanan" },
  { kategori: "Keamanan", subKategori: "CCTV", tipe: "IP Camera", frekuensi: "6 Bulanan" },
  { kategori: "Keamanan", subKategori: "Fire System", tipe: "Panel Alarm", frekuensi: "6 Bulanan" },
];

// --- Chart data helpers ---
export function getHealthDistribution() {
  const counts = { Healthy: 0, Watch: 0, Warning: 0, Critical: 0 };
  masterAssets.forEach((a) => counts[a.healthStatus]++);
  return [
    { name: "Healthy", value: counts.Healthy, fill: "hsl(152 60% 40%)" },
    { name: "Watch", value: counts.Watch, fill: "hsl(210 45% 43%)" },
    { name: "Warning", value: counts.Warning, fill: "hsl(38 92% 50%)" },
    { name: "Critical", value: counts.Critical, fill: "hsl(0 72% 51%)" },
  ];
}

export function getSisaUmurPerKategori() {
  const map: Record<string, { total: number; count: number }> = {};
  masterAssets.forEach((a) => {
    if (!map[a.kategori]) map[a.kategori] = { total: 0, count: 0 };
    map[a.kategori].total += a.sisaUmurHari;
    map[a.kategori].count++;
  });
  return Object.entries(map).map(([k, v]) => ({
    kategori: k,
    rataRata: Math.round(v.total / v.count),
  }));
}

export function getMonthlyDamageFrequency() {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const counts: Record<string, number> = {};
  months.forEach((m) => (counts[m] = 0));
  assetComplaints.forEach((c) => {
    const d = new Date(c.tanggalPerencanaan);
    const m = months[d.getMonth()];
    if (m) counts[m]++;
  });
  return months.map((m) => ({ bulan: m, jumlah: counts[m] }));
}

export function formatRupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}
