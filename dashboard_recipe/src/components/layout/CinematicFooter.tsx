"use client";

import Link from "next/link";

export function CinematicFooter() {
  return (
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
  );
}

