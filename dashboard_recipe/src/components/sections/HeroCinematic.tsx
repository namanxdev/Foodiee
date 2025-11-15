"use client";

import Image from "next/image";
import { GlowingButton } from "@/components/ui/GlowingButton";

const heroPoints = [
  {
    title: "Taste-aware intelligence",
    description: "Knows when you crave smoky tandoori, silky ramen, or crunchy mezze.",
  },
  {
    title: "Visual storytelling",
    description: "Every step glows with chef-shot imagery and AI-guided motion cues.",
  },
  {
    title: "Hands-free cooking",
    description: "Swipe through simmer, sear, baste — Foodiee keeps pace like a sous chef.",
  },
];

export function HeroCinematic() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#1E1E1E] via-[#0A0A0A] to-black">
      <div className="fixed top-0 left-0 right-0 h-screen -z-20 opacity-75">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-bubbling-masala-culinary-closeup-8517/1080p.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-hero-gradient mix-blend-overlay opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/65 to-[#0D0E10]" />
        <div className="absolute inset-0 [background:linear-gradient(to_bottom,transparent_0%,transparent_50%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.6)_75%,rgba(0,0,0,0.9)_85%,black_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[90vh] max-w-6xl flex-col gap-16 px-6 pb-24 pt-36 sm:px-10 md:px-12 lg:px-16">
        <div className="max-w-3xl space-y-8">
          <span className="inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#FFD07F] shadow-[0_15px_45px_-20px_rgba(255,90,47,0.65)]">
            Cinematic AI Sous Chef
            <span className="h-1 w-1 rounded-full bg-[#FFD07F]" />
            Powered by LangChain + Gemini
          </span>

          <div className="space-y-4 text-balance">
            <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Crave it. Cook it. Love it.
            </h1>
            <p className="max-w-2xl text-lg text-white/75 sm:text-xl md:text-2xl">
              Foodiee turns appetite into artistry. Feed it your cravings, and your AI sous
              chef orchestrates sizzling recipes, cinematic imagery, and step-by-step rhythm —
              so every meal feels like opening night.
            </p>
          </div>

          <GlowingButton
            label="Cook with AI Magic"
            href="/preferences"
            className="text-sm md:text-base"
          />

          <div className="flex flex-wrap gap-4 pt-4 text-white/70">
            {heroPoints.map((point) => (
              <span
                key={point.title}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]"
              >
                <span aria-hidden>✧</span>
                {point.title}
              </span>
            ))}
          </div>
        </div>

        <div className="relative grid gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-3xl md:grid-cols-[1.35fr_1fr] md:p-10">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E10] via-transparent to-transparent" />
              <Image
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80"
                alt="Hero dish featuring spiced paneer with herbs"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-[#FFD07F]/80">
                  Tonight&apos;s Feature
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-white">Smoky Charred Paneer</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  An ode to late-night cravings — lacquered paneer cubes, blistered peppers, and
                  a cumin-tamarind glaze finished with toasted sesame crunch.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs uppercase tracking-[0.35em] text-white/70">
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-semibold text-[#FFD07F]">15</p>
                  <span>Steps</span>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-semibold text-[#FFD07F]">35</p>
                  <span>Minutes</span>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-semibold text-[#FFD07F]">🔥</p>
                  <span>Heat</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
}

