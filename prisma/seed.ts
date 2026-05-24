import { PrismaClient, Role, StatusTiket, TindakanTeknisi } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Fungsi bantuan untuk membaca Excel
function readExcelData(fileName: string) {
  const filePath = path.resolve(__dirname, '../../exigen-smart-maintenance/data/ntg', fileName);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

// Fungsi bantuan untuk konversi tanggal Excel ke JS Date
function excelDateToJSDate(excelDate: any) {
  if (!excelDate || excelDate === '-') return new Date();
  
  if (typeof excelDate === 'number') {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }

  const dateStr = String(excelDate);
  let d = new Date(dateStr);

  if (isNaN(d.getTime())) {
    // Fallback: Parsing manual format DD-MM-YYYY atau DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      // Asumsi parts adalah [DD, MM, YYYY]
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Bulan 0-indexed di JS
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000; // Handle 2-digit years
      
      d = new Date(year, month, day);
    }
  }

  return isNaN(d.getTime()) ? new Date() : d;
}

// Fungsi bantuan untuk membagi array menjadi bagian-bagian kecil (Chunking)
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

async function main() {
  console.log('Mulai seeding data dengan mode BATCH (Super Cepat)...');

  // 1. Buat User Default
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nama: 'Administrator Manajemen',
      role: Role.MANAJEMEN,
    },
  });
  console.log('User Admin created:', admin.username);

  const teknisi = await prisma.user.upsert({
    where: { username: 'teknisi1' },
    update: {},
    create: {
      username: 'teknisi1',
      password: hashedPassword,
      nama: 'Teknisi Utama',
      role: Role.TEKNISI,
    },
  });
  console.log('User Teknisi created:', teknisi.username);

  const BATCH_SIZE = 5000; // Insert 5000 data sekaligus

  // 2. Import Master Asset
  try {
    console.log('Membaca data Master Asset...');
    const masterAssetsRaw = readExcelData('master_aset_enriched.xlsx') as any[];
    
    const masterAssetData = masterAssetsRaw.map((data) => ({
      id: String(data['id'] || data['ID'] || `AST-TMP-${Math.random().toString(36).substring(7)}`),
      nama: String(data['nama'] || data['Nama'] || '-'),
      merek: String(data['merek'] || data['Merek'] || '-'),
      model: String(data['model'] || data['Model'] || '-'),
      kategori: String(data['kategori'] || data['Kategori'] || '-'),
      subKategori: String(data['subKategori'] || data['Sub Kategori'] || '-'),
      tipe: String(data['tipe'] || data['Tipe'] || '-'),
      tanggalInstalasi: excelDateToJSDate(data['tanggalInstalasi'] || data['Tanggal Instalasi']),
      lokasiGedung: String(data['lokasiGedung'] || data['Lokasi Gedung'] || '-'),
      lokasiLantai: String(data['lokasiLantai'] || data['Lokasi Lantai'] || '-'),
      lokasiZona: String(data['lokasiZona'] || data['Lokasi Zona'] || '-'),
      tingkatKekritisan: String(data['tingkatKekritisan'] || data['Tingkat Kekritisan'] || '-'),
      status: String(data['status'] || data['Status'] || 'Aktif'),
      sisaUmurHari: Number(data['sisaUmurHari'] || data['Sisa Umur Hari'] || 0),
      estimasiPenggantian: excelDateToJSDate(data['estimasiPenggantian'] || data['Estimasi Penggantian']),
      healthStatus: String(data['healthStatus'] || data['Health Status'] || 'Healthy'),
    }));

    const chunks = chunkArray(masterAssetData, BATCH_SIZE);
    let totalInserted = 0;
    
    for (const chunk of chunks) {
      const result = await prisma.masterAsset.createMany({
        data: chunk,
        skipDuplicates: true, // Abaikan jika ID sudah ada
      });
      totalInserted += result.count;
      console.log(`Mengimpor Master Asset: ${totalInserted} / ${masterAssetData.length} baris...`);
    }
    console.log(`✅ Master Asset selesai diimport! (${totalInserted} baris)`);
  } catch (e) {
    console.log('❌ Gagal import Master Asset:', e);
  }

  // 3. Import Asset Complaints
  try {
    console.log('Membaca data Asset Complaints...');
    const complaintsRaw = readExcelData('aset_komplain_enriched.xlsx') as any[];
    
    const complaintsData = complaintsRaw.map((data) => ({
      id: String(data['id'] || data['ID'] || `CMP-${Math.random().toString(36).substring(7)}`),
      idAset: String(data['idAset'] || data['ID Aset'] || '-'),
      namaAset: String(data['namaAset'] || data['Nama Aset'] || '-'),
      kategori: String(data['kategori'] || data['Kategori'] || '-'),
      subKategori: String(data['subKategori'] || data['Sub Kategori'] || '-'),
      tipe: String(data['tipe'] || data['Tipe'] || '-'),
      tanggalPerencanaan: excelDateToJSDate(data['tanggalPerencanaan'] || data['Tanggal Perencanaan']),
      tanggalPengerjaan: excelDateToJSDate(data['tanggalPengerjaan'] || data['Tanggal Pengerjaan']),
      tanggalSelesai: data['tanggalSelesai'] || data['Tanggal Selesai'] ? excelDateToJSDate(data['tanggalSelesai'] || data['Tanggal Selesai']) : null,
      jenisKerusakan: String(data['jenisKerusakan'] || data['Jenis Kerusakan'] || '-'),
      severity: String(data['severity'] || data['Severity'] || 'Ringan'),
      penyebab: String(data['penyebab'] || data['Penyebab'] || '-'),
      biayaPerbaikan: Number(data['biayaPerbaikan'] || data['Biaya Perbaikan'] || 0),
      sparePartDigunakan: String(data['sparePartDigunakan'] || data['Spare Part Digunakan'] || '-'),
      statusTiket: StatusTiket.SELESAI,
      idTeknisi: teknisi.id
    }));

    const chunks = chunkArray(complaintsData, BATCH_SIZE);
    let totalInserted = 0;
    
    for (const chunk of chunks) {
      const result = await prisma.assetComplaint.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`Mengimpor Asset Complaints: ${totalInserted} / ${complaintsData.length} baris...`);
    }
    console.log(`✅ Asset Complaints selesai diimport! (${totalInserted} baris)`);
  } catch (e) {
    console.log('❌ Gagal import Asset Complaints:', e);
  }

  // 4. Import Replacement History
  try {
    console.log('Membaca data Replacement History...');
    const replHistoryRaw = readExcelData('riwayat_penggantian_aset.xlsx') as any[];
    
    const replHistoryData = replHistoryRaw.map((data) => ({
      idAsetLama: String(data['idAsetLama'] || data['ID Aset Lama'] || '-'),
      namaAsetLama: String(data['namaAsetLama'] || data['Nama Aset Lama'] || '-'),
      kategori: String(data['kategori'] || data['Kategori'] || '-'),
      tipe: String(data['tipe'] || data['Tipe'] || '-'),
      idAsetBaru: String(data['idAsetBaru'] || data['ID Aset Baru'] || '-'),
      tanggalPenggantian: excelDateToJSDate(data['tanggalPenggantian'] || data['Tanggal Penggantian']),
      alasanPenggantian: String(data['alasanPenggantian'] || data['Alasan Penggantian'] || '-'),
      biayaPenggantian: Number(data['biayaPenggantian'] || data['Biaya Penggantian'] || 0),
    }));

    const chunks = chunkArray(replHistoryData, BATCH_SIZE);
    let totalInserted = 0;
    
    for (const chunk of chunks) {
      const result = await prisma.replacementHistory.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`Mengimpor Replacement History: ${totalInserted} / ${replHistoryData.length} baris...`);
    }
    console.log(`✅ Replacement History selesai diimport! (${totalInserted} baris)`);
  } catch (e) {
    console.log('❌ Gagal import Replacement History:', e);
  }

  // 5. Import Frequency Plans
  try {
    console.log('Membaca data Frequency Plans...');
    const freqPlanRaw = readExcelData('rencana_kegiatan_frekuensi_enriched.xlsx') as any[];
    
    const freqPlanData = freqPlanRaw.map((data) => ({
      kategori: String(data['kategori'] || data['Kategori'] || '-'),
      subKategori: String(data['subKategori'] || data['Sub Kategori'] || '-'),
      tipe: String(data['tipe'] || data['Tipe'] || '-'),
      frekuensi: String(data['frekuensi'] || data['Frekuensi'] || '-'),
    }));

    const chunks = chunkArray(freqPlanData, BATCH_SIZE);
    let totalInserted = 0;
    
    for (const chunk of chunks) {
      const result = await prisma.frequencyPlan.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`Mengimpor Frequency Plans: ${totalInserted} / ${freqPlanData.length} baris...`);
    }
    console.log(`✅ Frequency Plans selesai diimport! (${totalInserted} baris)`);
  } catch (e) {
    console.log('❌ Gagal import Frequency Plans:', e);
  }

  console.log('✨ Semua Seeding BATCH selesai dengan sempurna!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
