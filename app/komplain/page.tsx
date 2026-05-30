"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  MessageSquareWarning,
  Loader2,
  Mic,
  MicOff,
  Info,
} from "lucide-react";
import { buatKomplainGuest } from "@/app/actions/ticket";

const initialState = { success: false, error: undefined as string | undefined };

export default function KomplainGuestPage() {
  const [state, formAction, isPending] = useActionState(buatKomplainGuest, initialState);
  const [keluhan, setKeluhan] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setVoiceUnsupported(true);
      return;
    }

    const recognition = new SR();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text: string = event.results[0][0].transcript;
      setKeluhan((prev) => (prev ? prev + " " + text : text));
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  /* ── Success state ─────────────────────────────────────── */
  if (state.success) {
    return (
      <div className="min-h-dvh flex flex-col bg-[hsl(223,64%,8%)] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,100vw)] aspect-square rounded-full bg-[hsl(210,53%,22%)] blur-[100px] opacity-30" />
        </div>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="font-heading text-xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs mb-8">
            Your report has been received and is awaiting a technician. We will
            follow up shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
            >
              Submit Another
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(210,45%,43%)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[hsl(210,45%,38%)] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ────────────────────────────────────────── */
  return (
    <div className="min-h-dvh flex flex-col bg-[hsl(223,64%,8%)] text-white relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[min(700px,100vw)] aspect-square rounded-full bg-[hsl(210,53%,22%)] blur-[120px] opacity-30" />
      </div>

      {/* Header — full-width, logo only */}
      <header className="relative z-10 shrink-0 border-b border-white/5">
        <div className="flex items-center px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(210,45%,43%)]">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-wider">EXIGEN</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 px-4 py-8">
        <div className="mx-auto max-w-lg">

          {/* Title */}
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[11px] text-amber-400/80">
              <MessageSquareWarning className="h-3 w-3 shrink-0" />
              Guest Complaint Form
            </div>
            <h1 className="font-heading text-2xl font-bold">Report an Asset Issue</h1>
            <p className="mt-2 text-sm text-white/40 leading-relaxed">
              Describe the problem clearly. No account needed.
            </p>
          </div>

          {/* Required-fields hint */}
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[hsl(210,45%,43%)]/20 bg-[hsl(210,45%,43%)]/5 p-4">
            <Info className="h-4 w-4 text-[hsl(210,45%,62%)] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-white/70 mb-1.5">
                Your description must include:
              </p>
              <ul className="space-y-1 text-xs text-white/45">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[hsl(210,45%,62%)] shrink-0" />
                  Name of the broken item (e.g. AC, elevator, pump)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[hsl(210,45%,62%)] shrink-0" />
                  Building name (e.g. Gedung A, Gedung Utama)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[hsl(210,45%,62%)] shrink-0" />
                  Floor number (e.g. Lantai 3, Lantai Dasar)
                </li>
              </ul>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <form action={formAction} className="space-y-5">
              {state.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {state.error}
                </div>
              )}

              {/* Complaint textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/70">
                    Complaint Description <span className="text-red-400">*</span>
                  </label>

                  {/* Voice button */}
                  {!voiceUnsupported ? (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={[
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                        isRecording
                          ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                          : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 shrink-0" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5 shrink-0" />
                          Voice
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-white/25">
                      Voice not supported
                    </span>
                  )}
                </div>

                <textarea
                  name="keluhan"
                  value={keluhan}
                  onChange={(e) => setKeluhan(e.target.value)}
                  rows={5}
                  required
                  placeholder={`Example: "The AC on the 3rd floor of Gedung A has not been cooling properly for 2 days. It turns on but blows warm air."`}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 transition-colors focus:border-[hsl(210,45%,43%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,45%,43%)]/40"
                />

                {isRecording && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                    Listening… speak clearly in Indonesian or English.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || keluhan.trim().length < 20}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(210,45%,43%)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[hsl(210,45%,38%)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquareWarning className="h-4 w-4 shrink-0" />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer — Back link at bottom */}
          <div className="mt-4 flex justify-end">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              Back
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
