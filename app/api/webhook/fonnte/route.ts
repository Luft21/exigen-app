import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/fonnte';

// Pastikan base URL FastAPI Anda benar. Jika di Windows biasanya http://localhost:8000
const FASTAPI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    // Fonnte bisa mengirim JSON atau FormData (UrlEncoded)
    const contentType = req.headers.get('content-type') || '';
    const textData = await req.text();
    
    let sender = '';
    let message = '';
    let url = '';

    if (contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(textData);
        sender = jsonData.sender || '';
        message = jsonData.message || '';
        url = jsonData.url || '';
      } catch (e) {
        console.error("Failed to parse Fonnte JSON", e);
      }
    } else {
      // Fallback ke URLSearchParams (Form Data)
      const params = new URLSearchParams(textData);
      sender = params.get('sender') || '';
      message = params.get('message') || '';
      url = params.get('url') || '';
    }
    
    if (!sender) {
      return NextResponse.json({ error: 'No sender found' }, { status: 400 });
    }

    let aiResponse;
    
    // Skenario 1: Ada File Audio PTT (Voice Note)
    if (url && (url.endsWith('.ogg') || url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.m4a') || url.includes('file'))) {
      // 1. Download audio dari Fonnte
      const audioResponse = await fetch(url);
      if (!audioResponse.ok) {
        throw new Error('Gagal mengunduh audio dari Fonnte');
      }
      
      const audioBlob = await audioResponse.blob();
      
      // 2. Teruskan ke FastAPI
      const fastApiFormData = new FormData();
      fastApiFormData.append('file', audioBlob, 'voicenote.ogg');
      
      const faRes = await fetch(`${FASTAPI_BASE_URL}/api/predict/voice`, {
        method: 'POST',
        body: fastApiFormData,
      });
      
      if (!faRes.ok) {
        throw new Error('FastAPI gagal memproses audio');
      }
      aiResponse = await faRes.json();
    } 
    // Skenario 2: Pesan Teks Biasa
    else if (message) {
      const faRes = await fetch(`${FASTAPI_BASE_URL}/api/predict/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_complaint: message }),
      });
      
      if (!faRes.ok) {
        const errText = await faRes.text();
        throw new Error(`FastAPI gagal memproses teks: ${errText}`);
      }
      aiResponse = await faRes.json();
    } else {
      return NextResponse.json({ error: 'No message or audio url provided' }, { status: 400 });
    }

    // ==========================================
    // LOGIKA PENANGANAN DATABASE & AUTO-REPLY
    // ==========================================
    
    // Generate ID Tiket
    const ticketId = `STG-WA-${Date.now()}`;
    
    if (aiResponse.status_tiket === 'Open' || aiResponse.is_complete === true) {
      // A. KOMPLAIN LENGKAP
      await prisma.komplainPerbaikan.create({
        data: {
          id: ticketId,
          teksKeluhan: aiResponse.teks_asli || message,
          predTipeAset: aiResponse.predictions.tipe_aset || 'Unknown',
          predLokasiGedung: aiResponse.predictions.lokasi_gedung || '-',
          predLokasiLantai: aiResponse.predictions.lokasi_lantai,
          predLokasiZona: aiResponse.predictions.lokasi_zona || '-',
          predKategoriDept: aiResponse.predictions.kategori_dept || 'Unknown',
          predSeverityAwal: aiResponse.predictions.severity_awal || 'Rendah',
          isComplete: true,
          requiresFollowUp: false,
          statusStaging: 'OPEN'
        }
      });
      
      // Balas ke WA Pelapor dengan jeda (delay) agar aman dari blokir
      const replyText = `*[Exigen Smart Maintenance]*\n✅ Laporan kerusakan Anda berhasil diterima dan masuk ke antrean Admin.\n\n*Nomor Tiket:* #${ticketId}\n*Aset:* ${aiResponse.predictions.tipe_aset}\n*Lokasi:* ${aiResponse.predictions.lokasi_gedung}, Lt. ${aiResponse.predictions.lokasi_lantai || '-'}, ${aiResponse.predictions.lokasi_zona}\n*Prioritas:* ${aiResponse.predictions.severity_awal}\n\nTeknisi akan segera ditugaskan. Terima kasih!`;
      
      // Kirim tanpa blocking response webhook
      sendWhatsAppMessage(sender, replyText, 3000); // Jeda 3 detik
      
    } else {
      // B. KOMPLAIN TIDAK LENGKAP
      const missing = aiResponse.missing_fields || [];
      let missingText = 'lokasi atau detail lainnya';
      
      if (missing.length > 0) {
        missingText = missing.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
      }
      
      // Simpan sebagai DRAFT (Sesuai kesepakatan)
      await prisma.komplainPerbaikan.create({
        data: {
          id: ticketId,
          teksKeluhan: aiResponse.teks_asli || message,
          predTipeAset: aiResponse.predictions.tipe_aset || 'Unknown',
          predLokasiGedung: aiResponse.predictions.lokasi_gedung || '-',
          predLokasiLantai: aiResponse.predictions.lokasi_lantai,
          predLokasiZona: aiResponse.predictions.lokasi_zona || '-',
          predKategoriDept: aiResponse.predictions.kategori_dept || 'Unknown',
          predSeverityAwal: aiResponse.predictions.severity_awal || 'Rendah',
          isComplete: false,
          requiresFollowUp: true,
          statusStaging: 'DRAFT'
        }
      });

      // Balas ke WA Pelapor minta lengkapi
      const replyText = `*[Exigen Smart Maintenance]*\n⚠️ Laporan kerusakan Anda terdeteksi belum lengkap.\n\nUntuk mempercepat penanganan, mohon balas pesan ini dengan melengkapi informasi berikut:\n*${missingText}*\n\n_(Tiket Anda tersimpan sementara sebagai Draft dengan Nomor #${ticketId})_`;
      
      sendWhatsAppMessage(sender, replyText, 3000); // Jeda 3 detik
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });

  } catch (error: any) {
    console.error('Fonnte Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
