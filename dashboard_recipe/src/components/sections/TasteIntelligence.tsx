"use client";

import { GlassCard } from "@/components/ui/GlassCard";

const featureCards = [
  {
    eyebrow: "Gemini + LangChain",
    title: "AI that knows your taste",
    description:
      "Foodiee blends your pantry, dietary flags, and cravings into spot-on matches — apprenticed on chef-grade cookbooks.",
    details: ["Pantry sync intelligence", "Mood + time-of-day inference", "Chef-speak translation"],
  },
  {
    eyebrow: "Guided Flow",
    title: "Step by step with visuals",
    description:
      "Every motion is choreographed with motion cues, sizzling audio hints, and on-demand plating videos.",
    details: ["Motion-aware step reader", "Touch + voice navigation", "AI image per instruction"],
  },
  {
    eyebrow: "Culinary Canvas",
    title: "Chef’s gallery",
    description:
      "Scroll through AI-generated dishes that react to your appetite — tilt, zoom, and feel the heat.",
    details: ["Live-refreshing gallery", "Tilt to reveal textures", "Swipe-to-save favorites"],
  },
];

export function TasteIntelligence() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 md:px-12 lg:px-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/80">Why Foodiee</p>
        <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          The only AI that seasons like a chef.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
          Your sous chef learns your rituals — when you crave midnight ramen, how crispy you like
          your dosa, and the exact heat level that makes your heart race.
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {featureCards.map((card, index) => (
          <GlassCard
            key={card.title}
            eyebrow={card.eyebrow}
            title={card.title}
            highlight={index === 0}
            className="bg-gradient-to-br from-white/6 via-white/4 to-white/2"
          >
            <p>{card.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/65">
              {card.details.map((detail) => (
                <li key={detail} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#FFD07F]/80" />
                  {detail}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>

      <div className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-r from-[#FF5A2F]/15 via-transparent to-transparent p-10 backdrop-blur-2xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-4 text-balance">
            <h3 className="text-3xl font-semibold text-white">
              “This feels like a Michelin cook-along — Foodiee reads my mood and plates the story.”
            </h3>
            <p className="text-sm uppercase tracking-[0.4em] text-[#FFD07F]/80">
              Lila Rao — Food stylist & Foodiee Insider
            </p>
          </div>
          <div className="grid gap-4 text-xs uppercase tracking-[0.35em] text-white/70 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-2xl font-semibold text-[#FFD07F]">+92%</p>
              Ingredient satisfaction
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-2xl font-semibold text-[#FFD07F]">3x</p>
              Repeat cravings captured
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

