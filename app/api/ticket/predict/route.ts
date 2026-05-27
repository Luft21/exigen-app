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
            // SKENARIO A: LENGKAP -> Simpan ke Tabel Staging (KomplainPerbaikan)
            
            // Konversi tipe lantai ke Integer (karena NLP mengembalikan string / angka)
            let lantai = 0;
            const predLantai = aiResponse.predictions.lokasi_lantai;
            if (predLantai) {
                const parsed = parseInt(predLantai, 10);
                if (!isNaN(parsed)) lantai = parsed;
            }

            const newTicket = await prisma.komplainPerbaikan.create({
                data: {
                    id: `STG-${Date.now()}`,
                    teksKeluhan: aiResponse.teks_asli || '',
                    predTipeAset: aiResponse.predictions.tipe_aset || 'Unknown',
                    predLokasiGedung: aiResponse.predictions.lokasi_gedung || '-',
                    predLokasiLantai: lantai,
                    predLokasiZona: aiResponse.predictions.lokasi_zona || '-',
                    predKategoriDept: aiResponse.predictions.kategori_dept || 'Unknown',
                    predSeverityAwal: aiResponse.predictions.severity_awal || 'Rendah',
                    isComplete: true,
                    requiresFollowUp: false,
                    statusStaging: 'OPEN'
                }
            });

            return NextResponse.json({
                success: true,
                message: `Laporan berhasil masuk ke antrean Staging dengan Nomor Tiket #${newTicket.id}`,
                data: aiResponse
            });

        } else {
            // SKENARIO B: TIDAK LENGKAP -> Simpan Draft & Kembalikan Pesan Bot
            // Opsional: Simpan ke tabel sementara misal `DraftComplaint` (jika ada di schema)
            // await prisma.draftComplaint.create({ ... });

            const missing = aiResponse.missing_fields || [];
            let botMessage = 'Informasi belum lengkap, mohon sebutkan lokasi atau detail lainnya.';
            
            if (missing.length > 0) {
                const missingText = missing.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
                botMessage = `Terdapat informasi lokasi yang belum lengkap. Mohon lengkapi bagian berikut: ${missingText}.`;
            }

            return NextResponse.json({
                success: false,
                is_complete: false,
                requires_follow_up: aiResponse.requires_follow_up || true,
                missing_fields: missing,
                message: botMessage,
                draft_data: aiResponse.predictions,
                raw_ai_response: aiResponse // Untuk keperluan debugging
            }); // Return 200 OK karena API berhasil memproses, hanya saja data kurang lengkap
        }

    } catch (error) {
        console.error('Error in API Predict:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server backend' }, { status: 500 });
    }
}
