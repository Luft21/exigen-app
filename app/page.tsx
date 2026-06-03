import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Shield,
  Clock,
  ClipboardList,
  Gauge,
  MessageSquareWarning,
} from "lucide-react";
import { ComplaintForm } from "@/components/complaint-form";

export const metadata = {
  title: "Exigen — Predictive Asset Maintenance",
  description: "Monitor and predict industrial asset lifespan.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[hsl(223,64%,8%)] text-white relative overflow-hidden">
      {/* Top Glow ONLY (Bagian atas ada sedikit gradasi kecil) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] aspect-square rounded-full bg-[hsl(210,53%,22%)] blur-[120px] opacity-35" />
      </div>

      {/* Nav */}
      <header className="relative z-10 shrink-0 border-b border-white/5">
        <div className="flex items-center px-6 py-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(210,45%,43%)]">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-wider text-white">EXIGEN</span>
          </div>
        </div>
      </header>

      {/* Main Content Scroll Container */}
      <main className="relative z-10 flex-1 overflow-y-auto scroll-smooth">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center pt-32 pb-16 px-6 text-center w-full min-h-[90vh] justify-center relative">
          <div className="flex w-full max-w-2xl flex-col items-center">
            <h1 className="font-heading font-bold tracking-tight leading-snug text-[2rem] sm:text-4xl md:text-5xl text-white">
              Predict Asset Lifespan
              <br />
              <span className="text-[hsl(210,45%,62%)]">Before Failure Occurs</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm md:text-base leading-relaxed text-white/50">
              Know when industrial assets need servicing or replacement, based on
              historical usage data — before it&apos;s too late.
            </p>

            {/* Login & Guest Buttons */}
            <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2">
              <Link
                href="/login"
                className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-[hsl(210,45%,43%)]/60 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(210,45%,43%)]/20">
                  <Shield className="h-5 w-5 text-[hsl(210,45%,62%)]" />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-sm font-bold text-white">Technician & Admin</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                    Access dashboard, asset data, complaint tickets, and maintenance reports.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(210,45%,62%)] transition-all duration-200 group-hover:gap-3">
                  Login Dashboard
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </div>
              </Link>

              <a
                href="#komplain"
                className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-amber-500/40 hover:bg-white/[0.07]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <MessageSquareWarning className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-sm font-bold text-white">Guest Report</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                    Report asset damage or issues without an account directly on this page.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 transition-all duration-200 group-hover:gap-3">
                  Submit a Complaint
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </div>
              </a>
            </div>

            <div className="mt-16 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/60">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Asset Lifespan Prediction
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                Complaint Ticket Analysis
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Gauge className="h-3.5 w-3.5 shrink-0" />
                Asset Condition Monitoring
              </span>
            </div>
          </div>
        </section>

        {/* Complaint Form Section (Scroll down) - FULL SCREEN, NO GLOW */}
        <section id="komplain" className="w-full relative min-h-dvh flex items-center justify-center bg-[hsl(223,64%,8%)] border-t border-white/5 scroll-mt-0">
          <div className="relative z-10 w-full px-6 py-24">
            <ComplaintForm />
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-6 px-6 text-center text-xs text-white/40 bg-[hsl(223,64%,8%)]">
          <p>© {new Date().getFullYear()} Exigen Smart Maintenance. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
