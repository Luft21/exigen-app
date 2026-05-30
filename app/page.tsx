import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Shield,
  MessageSquareWarning,
  Clock,
  ClipboardList,
  Gauge,
} from "lucide-react";

export const metadata = {
  title: "Exigen — Predictive Asset Maintenance",
  description: "Monitor and predict industrial asset lifespan.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[hsl(223,64%,8%)] text-white relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] aspect-square rounded-full bg-[hsl(210,53%,22%)] blur-[120px] opacity-35" />
      </div>

      {/* Nav — full-width, logo pinned to left edge (standard convention) */}
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

      {/* Hero — everything centered */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex w-full max-w-2xl flex-col items-center">

          <h1 className="font-heading font-bold tracking-tight leading-snug text-[2rem] sm:text-4xl">
            Predict Asset Lifespan
            <br />
            <span className="text-[hsl(210,45%,62%)]">Before Failure Occurs</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/50 sm:text-[0.9375rem]">
            Know when industrial assets need servicing or replacement, based on
            historical usage data — before it&apos;s too late.
          </p>

          <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2">

            <Link
              href="/login"
              className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-[hsl(210,45%,43%)]/60 hover:bg-white/[0.07]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(210,45%,43%)]/20">
                <Shield className="h-5 w-5 text-[hsl(210,45%,62%)]" />
              </div>
              <div className="flex-1">
                <p className="font-heading text-sm font-bold">Login</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                  For Management and Technicians. Access the dashboard, asset
                  data, complaint tickets, and maintenance reports.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(210,45%,62%)] transition-all duration-200 group-hover:gap-3">
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </div>
            </Link>

            <Link
              href="/komplain"
              className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-amber-500/40 hover:bg-white/[0.07]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <MessageSquareWarning className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-heading text-sm font-bold">Guest</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/40">
                  Report asset damage or issues without an account. Fill in
                  the complaint form directly.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 transition-all duration-200 group-hover:gap-3">
                Submit a Complaint
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </div>
            </Link>

          </div>

          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] text-white/40">
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
      </main>
    </div>
  );
}
