Atur Peran Anda sebagai: Senior Fullstack Web & Integration Engineer.
Tugas Anda adalah: Membantu menulis kode backend Next.js (App Router/Pages Router) untuk mengintegrasikan sistem Frontend Web ke Model NLP & Speech-to-Text (STT) yang berjalan di server FastAPI Python lokal (Port 8000).

Berikut adalah detail arsitektur, kontrak data JSON, dan aturan logika integrasi yang WAJIB dipatuhi:

### 1. INFORMASI ENVIRONMENT & ENDPOINT (FASTAPI)
- Base URL API (Development): http://localhost:8000 (atau URL Ngrok Publik jika remote).
- Endpoint Teks: POST `/api/predict/text`
- Endpoint Suara/Audio: POST `/api/predict/voice`

### 2. KONTRAK DATA & STRUKTUR PAYLOAD JSON
Model NLP akan selalu mengembalikan objek JSON dengan struktur anti-halusinasi (Guardrail) sebagai berikut:
{
    "status_tiket": "Open" ATAU "Draft (Butuh Info Tambahan)",
    "is_complete": true/false,
    "missing_entities": ["Lokasi Gedung", "Lantai"], 
    "pesan_bot": "Mohon maaf, agar teknisi bisa meluncur, tolong sebutkan informasi yang kurang: Lokasi Gedung, Lantai.",
    "teks_asli": "string input mentah",
    "teks_bersih": "string hasil regex binding",
    "predictions": {
        "tipe_aset": "string" atau null,
        "lokasi_gedung": "string" atau null,
        "lokasi_lantai": "string" atau null,
        "lokasi_zona": "string" atau null,
        "kategori_dept": "string",
        "severity_awal": "string"
    },
    "trigger_whatsapp_alert": true/false,
    "waktu_komputasi_detik": 0.045
}

### 3. ATURAN LOGIKA INTEGRASI DI NEXT.JS (STATE & DATABASE MANAGEMENT)
Backend Next.js wajib menangani respons dari FastAPI dengan aturan logika berikut:

A. JIKA `is_complete == true`:
   1. Next.js harus langsung menyimpan data ke database tabel tiket utama (`df_perbaikan`) dengan status resmi "Open".
   2. Ambil nilai string lengkap dari `predictions` untuk mengisi kolom 'tipe_aset', 'lokasi_gedung', dll.
   3. Kembalikan respons sukses ke UI Frontend untuk menampilkan notifikasi: "Laporan berhasil dibuka dengan Nomor Tiket #XXXX".

B. JIKA `is_complete == false`:
   1. Next.js JANGAN membuka tiket utama dulu. Simpan record keluhan ini ke dalam tabel database sementara sebagai status "Draft".
   2. Ambil string dari variabel `pesan_bot` (isi instruksi entitas apa saja yang kurang).
   3. Kirim string `pesan_bot` tersebut ke UI Frontend untuk ditampilkan sebagai pesan peringatan berwarna merah di Form Laporan Web, agar pengguna tahu mereka harus melengkapi tulisan yang kurang.

### 4. ATURAN REKAYASA FORWARDING FILE AUDIO (SPEECH-TO-TEXT)
- Ketika UI Frontend mengirimkan file rekaman suara (Voice Note) user, Next.js bertugas menangkap file biner tersebut.
- Next.js harus meneruskan (*forward*) file audio tersebut ke FastAPI `POST /api/predict/voice` menggunakan format `multipart/form-data` dengan nama key data: `file`.
- Tunggu respons transkripsi + klasifikasi balik dari FastAPI, lalu terapkan aturan logika (A) atau (B) di atas.

---

SABDA INSTRUKSI:
Berdasarkan spesifikasi integrasi di atas, buatkan panduan kode Next.js lengkap yang meliputi:
1. Skema fungsionalitas fetch (Handler API Route Next.js) menggunakan Axios atau Fetch API bawaan untuk Endpoint Teks dan Audio (Multipart FormData).
2. Contoh penulisan file `.env` yang rapi di sisi Next.js untuk menyimpan URL API FastAPI.
3. Penjelasan singkat bagaimana Next.js harus mengelola State form berdasarkan boolean `is_complete`.

Tulis kode yang clean, robust, dan siap pakai dalam TypeScript / JavaScript!