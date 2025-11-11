"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { HeroCinematic } from "@/components/sections/HeroCinematic";
import { TasteIntelligence } from "@/components/sections/TasteIntelligence";
import { StepShowcase } from "@/components/sections/StepShowcase";
import { ChefGallery } from "@/components/sections/ChefGallery";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { FancyFadeIn } from "@/components/animations/FancyComponents";

export default function Home() {
  const { status } = useSession();

  return (
    <div className="flex min-h-screen flex-col text-white">
      <header className="fixed inset-x-0 top-4 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/15 bg-black/60 px-6 py-4 backdrop-blur-2xl sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5A2F] to-[#FFD07F] text-lg font-black text-[#1E1E1E] shadow-[0_12px_30px_-15px_rgba(255,90,47,0.7)]">
              F
            </span>
            <div className="text-sm">
              <p className="font-semibold tracking-wide text-white group-hover:text-[#FFD07F]">
                Foodiee
              </p>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Cinematic Sous Chef
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.4em] text-white/70 md:flex">
            <Link href="#taste" className="transition hover:text-[#FFD07F]">
              Taste Brain
            </Link>
            <Link href="#steps" className="transition hover:text-[#FFD07F]">
              Guided Steps
            </Link>
            <Link href="#gallery" className="transition hover:text-[#FFD07F]">
              Gallery
            </Link>
            <Link href="/preferences" className="transition hover:text-[#FFD07F]">
              Start Flow
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/75 transition hover:border-[#FFD07F]/60 hover:text-[#FFD07F] md:inline-flex"
            >
              {status === "authenticated" ? "Dashboard" : "Sign in"}
            </Link>
            <GlowingButton label="Cook with AI Magic" href="/preferences" />
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col gap-12 pb-24">
        <HeroCinematic />
        <div id="taste">
          <TasteIntelligence />
        </div>
        <div id="steps">
          <StepShowcase />
        </div>
        <div id="gallery">
          <ChefGallery />
        </div>
      </main>

      <FancyFadeIn delay={0.1} className="px-6 pb-16 pt-10 sm:px-10 md:px-12 lg:px-16">
        <footer className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/60 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/80">Foodiee</p>
            <p className="mt-2 text-white/70">
              Powered by FastAPI, LangChain, and AI image artistry. Crafted by Oldowan Innovations.
            </p>
          </div>
          <div className="flex gap-4 text-xs uppercase tracking-[0.35em]">
            <Link href="/preferences" className="hover:text-[#FFD07F]">
              Start preferences
            </Link>
            <Link href="/recommendations" className="hover:text-[#FFD07F]">
              View picks
            </Link>
            <Link href="/images" className="hover:text-[#FFD07F]">
              Image gallery
            </Link>
          </div>
        </footer>
      </FancyFadeIn>
    </div>
  );
}
