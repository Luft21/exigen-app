import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

        const contentType = req.headers.get('content-type') || '';
        const isFormData = contentType.includes('multipart/form-data');

        if (!isFormData) {
            return NextResponse.json({ error: 'Request harus berupa form-data' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'File audio tidak ditemukan' }, { status: 400 });
        }

        // Forward file ke FastAPI /api/transcribe/voice
        const fastApiFormData = new FormData();
        fastApiFormData.append('file', file);

        const response = await fetch(`${AI_URL}/api/transcribe/voice`, {
            method: 'POST',
            body: fastApiFormData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.detail || 'Terjadi kesalahan pada AI Server saat proses transkripsi' }, { status: response.status });
        }

        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            text: data.text
        });

    } catch (error) {
        console.error('Error in API Transcribe:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server backend' }, { status: 500 });
    }
}
