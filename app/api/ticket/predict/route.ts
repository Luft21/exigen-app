import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Sesuaikan path prisma client Anda

export async function POST(req: NextRequest) {
    try {
        const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

        // Cek apakah request berupa FormData (Audio) atau JSON (Text)
        const contentType = req.headers.get('content-type') || '';
        const isFormData = contentType.includes('multipart/form-data');

        let aiResponse;

        if (isFormData) {
            // PENANGANAN SUARA (AUDIO FORWARDING)
            const formData = await req.formData();
            const file = formData.get('file');

            if (!file) {
                return NextResponse.json({ error: 'File audio tidak ditemukan' }, { status: 400 });
            }

            // Forward file ke FastAPI /api/predict/voice
            const fastApiFormData = new FormData();
            fastApiFormData.append('file', file);

            const response = await fetch(`${AI_URL}/api/predict/voice`, {
                method: 'POST',
                body: fastApiFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                return NextResponse.json({ error: errorData.detail || 'Terjadi kesalahan pada AI Server saat proses audio' }, { status: response.status });
            }

            aiResponse = await response.json();
        } else {
            // PENANGANAN TEKS MURNI
            const body = await req.json();

            const response = await fetch(`${AI_URL}/api/predict/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text_complaint: body.teks_keluhan }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return NextResponse.json({ error: errorData.detail || 'Terjadi kesalahan pada AI Server' }, { status: response.status });
            }

            aiResponse = await response.json();
        }

        // ==========================================
        // LOGIKA PENANGANAN DATABASE & STATE
        // ==========================================

        if (aiResponse.status_tiket === 'Open' || aiResponse.is_complete === true) {
            // SKENARIO A: LENGKAP -> Buka Tiket Resmi
            
            // Karena ID Aset sesungguhnya akan diinput oleh admin nanti (setelah ditutup),
            // kita gunakan satu aset penampung (AST-PENDING) agar tidak melanggar Foreign Key DB
            let pendingAsset = await prisma.masterAsset.findUnique({
                where: { id: 'AST-PENDING' }
            });

            if (!pendingAsset) {
                pendingAsset = await prisma.masterAsset.create({
                    data: {
                        id: 'AST-PENDING',
                        nama: 'Belum Di-assign (Menunggu Admin)',
                        merek: '-',
                        model: '-',
                        kategori: '-',
                        subKategori: '-',
                        tipe: '-',
                        tanggalInstalasi: new Date(),
                        lokasiGedung: '-',
                        lokasiLantai: '-',
                        lokasiZona: '-',
                        tingkatKekritisan: 'Rendah',
                        status: 'Aktif',
                        sisaUmurHari: 0,
                        estimasiPenggantian: new Date(),
                        healthStatus: 'Unknown'
                    }
                });
            }

            const newTicket = await prisma.assetComplaint.create({
                data: {
                    id: `TKT-${Date.now()}`,
                    idAset: pendingAsset.id, 
                    namaAset: aiResponse.predictions.tipe_aset || 'Aset Tidak Diketahui',
                    kategori: aiResponse.predictions.kategori_dept || 'Unknown',
                    subKategori: '-',
                    tipe: aiResponse.predictions.tipe_aset || '-',
                    tanggalPerencanaan: new Date(),
                    tanggalPengerjaan: new Date(),
                    jenisKerusakan: aiResponse.teks_asli,
                    severity: aiResponse.predictions.severity_awal,
                    penyebab: 'Menunggu Teknisi',
                    biayaPerbaikan: 0,
                    sparePartDigunakan: '-',
                    statusTiket: 'MENUNGGU_TEKNISI',
                }
            });

            return NextResponse.json({
                success: true,
                message: `Laporan berhasil dibuka dengan Nomor Tiket #${newTicket.id}`,
                data: aiResponse
            });

        } else {
            // SKENARIO B: TIDAK LENGKAP -> Simpan Draft & Kembalikan Pesan Bot
            // Opsional: Simpan ke tabel sementara misal `DraftComplaint` (jika ada di schema)
            // await prisma.draftComplaint.create({ ... });

            return NextResponse.json({
                success: false,
                is_complete: false,
                message: aiResponse.pesan_bot || 'Informasi belum lengkap, mohon sebutkan lokasi atau detail lainnya.',
                missing_entities: aiResponse.missing_entities,
                draft_data: aiResponse.predictions,
                raw_ai_response: aiResponse // Untuk keperluan debugging
            }); // Return 200 OK karena API berhasil memproses, hanya saja data kurang lengkap
        }

    } catch (error) {
        console.error('Error in API Predict:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server backend' }, { status: 500 });
    }
}
