"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SessionStatus } from "next-auth";
import { GlowingButton } from "@/components/ui/GlowingButton";

export interface CinematicNavProps {
  status: SessionStatus;
}

export function CinematicNav({ status }: CinematicNavProps) {
  const authLabel = useMemo(
    () => (status === "authenticated" ? "Dashboard" : "Sign in"),
    [status]
  );

  return (
    <header className="fixed inset-x-0 top-4 z-40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/15 bg-black/60 px-6 py-4 text-white backdrop-blur-2xl sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5A2F] to-[#FFD07F] text-lg font-black text-[#1E1E1E] shadow-[0_12px_30px_-15px_rgba(255,90,47,0.7)]">
            F
          </span>
          <div className="text-sm">
            <p className="font-semibold tracking-wide text-white group-hover:text-[#FFD07F] transition-colors">
              Foodiee
            </p>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Cinematic Sous Chef
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.4em] text-white/70 md:flex">
          <Link href="/preferences" className="transition hover:text-[#FFD07F]">
            Preferences
          </Link>
          <Link href="/chat" className="transition hover:text-[#FFD07F]">
            Chat
          </Link>
          <Link href="/history" className="transition hover:text-[#FFD07F]">
            History
          </Link>
          <Link href="/top-recipes" className="transition hover:text-[#FFD07F]">
            Top Recipes
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="hidden rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/75 transition hover:border-[#FFD07F]/60 hover:text-[#FFD07F] md:inline-flex"
          >
            {authLabel}
          </Link>
          <GlowingButton label="Cook with AI Magic" href="/preferences" className="px-6 py-2 text-xs" />
        </div>
      </nav>
    </header>
  );
}

