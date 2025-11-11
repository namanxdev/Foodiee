"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthGate from "@/components/auth/AuthGate";
import CinematicPreferencesForm from "@/components/preferences/CinematicPreferencesForm";
import {
  FancyParticleLayer,
  FancySpotlight,
} from "@/components/animations/FancyComponents";

export default function PreferencesPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefillIngredient = searchParams.get("prefill") ?? undefined;

  useEffect(() => {
    const urlSessionId = searchParams.get("session_id");
    if (urlSessionId) {
      router.replace(`/chat?session_id=${urlSessionId}`);
    }
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.28)_0%,_rgba(30,30,30,0.92)_40%,_rgba(10,10,10,1)_100%)] text-white">
      <FancyParticleLayer density={14} />
      <FancySpotlight size={520} blur={140} />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 pb-10 pt-12 sm:px-10 md:px-12 lg:px-16">
        <div>
          <Link href="/" className="text-sm uppercase tracking-[0.45em] text-[#FFD07F]/80">
            ← Back to cinematic landing
          </Link>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Your cravings, choreographed.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70">
            Dial in flavors, moods, time, and pantry — Foodiee’s AI sous chef will light up
            chef-grade experiences tuned to your appetite.
          </p>
        </div>
        <div className="hidden flex-col items-end text-xs uppercase tracking-[0.4em] text-white/60 md:flex">
          <span className="rounded-full border border-white/15 px-4 py-2">
            Step 1 · Preferences
          </span>
          <span className="mt-3 rounded-full border border-white/15 px-4 py-2">
            Step 2 · Recommendations
          </span>
          <span className="mt-3 rounded-full border border-white/15 px-4 py-2">
            Step 3 · Cooking Flow
          </span>
        </div>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pb-24 sm:px-10 md:px-12 lg:px-16">
        <AuthGate status={status}>
          <CinematicPreferencesForm
            onSubmit={() => {
              /* handled inside form */
            }}
            prefillIngredient={prefillIngredient}
          />
        </AuthGate>
      </main>
    </div>
  );
}
