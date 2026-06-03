"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  CornerDownLeft,
} from "lucide-react";
import { buatKomplainGuest } from "@/app/actions/ticket";

const initialState = { success: false, error: undefined as string | undefined };

export function ComplaintForm() {
  const [state, formAction, isPending] = useActionState(buatKomplainGuest, initialState);
  const [keluhan, setKeluhan] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [keluhan]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");

          const res = await fetch("/api/ticket/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setKeluhan((prev) => (prev ? prev + " " + data.text : data.text));
          } else {
            console.error("Transkripsi gagal:", data.error);
            alert("Gagal melakukan transkripsi suara: " + (data.error || "Unknown error"));
          }
        } catch (error) {
          console.error("Error transcribing:", error);
          alert("Terjadi kesalahan sistem saat transkripsi suara.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Gagal mengakses mikrofon", err);
      alert("Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="font-heading text-3xl font-bold mb-3 text-white">Laporan Terkirim!</h2>
        <p className="text-base text-white/70 leading-relaxed max-w-sm mb-8">
          Terima kasih atas laporan Anda. Keluhan telah masuk ke sistem dan segera ditangani teknisi.
        </p>
        <button
          onClick={() => {
            setKeluhan("");
            window.location.reload(); // Quick reset
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          Kirim Laporan Baru
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl text-center flex flex-col items-center">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold sm:text-5xl text-white tracking-tight">
          Ceritakan Masalahnya
        </h2>
        <p className="mt-4 text-base text-white/70 leading-relaxed max-w-lg mx-auto font-medium">
          Sebutkan nama barang (AC, lampu, dll), beserta lokasi spesifiknya (Gedung, Lantai, atau Zona). Kami akan mengurus sisanya.
        </p>
      </div>

      <div className="w-full relative max-w-3xl group mt-4">
        <form ref={formRef} action={formAction}>
          {state.error && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-sm text-red-400 whitespace-nowrap">
              {state.error}
            </div>
          )}

          <div className="relative flex items-end">
            <textarea
              ref={textareaRef}
              name="keluhan"
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (keluhan.trim().length >= 15 && !isPending) {
                    formRef.current?.requestSubmit();
                  }
                }
              }}
              required
              rows={1}
              placeholder="Ketik keluhan di sini..."
              className="w-full resize-none overflow-hidden bg-transparent border-b-2 border-white/30 px-2 py-4 pr-32 text-2xl sm:text-3xl lg:text-4xl font-heading font-medium text-white placeholder-white/40 transition-all focus:border-[hsl(210,45%,62%)] focus:outline-none min-h-[60px]"
            />

            <div className="absolute right-2 bottom-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isTranscribing}
                title="Gunakan Suara"
                className={[
                  "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all",
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "bg-white/10 text-white/80 hover:text-white hover:bg-white/20",
                ].join(" ")}
              >
                {isTranscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              <button
                type="submit"
                title="Kirim (Enter)"
                disabled={isPending || keluhan.trim().length < 15}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[hsl(210,45%,43%)] text-white transition-all hover:bg-[hsl(210,45%,50%)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-none"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CornerDownLeft className="h-5 w-5 ml-1 mt-1" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 text-left px-2 flex items-center justify-between">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Mendengarkan...
              </span>
            ) : isTranscribing ? (
              <span className="flex items-center gap-1.5 text-xs text-[hsl(210,45%,62%)] font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                Memproses suara...
              </span>
            ) : (
              <span className="text-xs text-white/50 font-medium">

              </span>
            )}

            <span className="text-[10px] text-white/30 uppercase tracking-wider hidden sm:block">
              {keluhan.trim().length}/15 karakter min.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
