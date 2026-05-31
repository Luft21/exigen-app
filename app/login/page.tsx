"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Incorrect username or password.");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[hsl(223,64%,8%)] text-white relative overflow-hidden px-4 py-12">
      {/* Glow centered behind the card */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,100vw)] aspect-square rounded-full bg-[hsl(210,53%,22%)] blur-[100px] opacity-35" />
      </div>

      {/* Single centered column — logo → title → form → footer */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(210,45%,43%)]">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-xl font-bold">Sign in to Exigen</h1>
          <p className="mt-1.5 text-sm text-white/40">For Management and Technicians</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/60">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                suppressHydrationWarning
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 transition-colors focus:border-[hsl(210,45%,43%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,45%,43%)]/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/60">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                suppressHydrationWarning
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 transition-colors focus:border-[hsl(210,45%,43%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,45%,43%)]/40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(210,45%,43%)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(210,45%,38%)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer row — demo hint + back link */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-white/25">
            Demo: admin / password123
          </p>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            Back
          </Link>
        </div>

      </div>
    </div>
  );
}
