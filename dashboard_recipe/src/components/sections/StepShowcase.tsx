"use client";

import Image from "next/image";

const steps = [
  {
    title: "Ignite the wok",
    description: "Toss aromatics in smoking oil — watch garlic confetti dance in slow motion.",
    media:
      "https://images.pexels.com/photos/3298905/pexels-photo-3298905.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    title: "Glaze with tamarind",
    description: "Swirl the sauce until it ribbons and coats every roasted veg with glossy sheen.",
    media:
      "https://images.pexels.com/photos/5419336/pexels-photo-5419336.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    title: "Finish with ember butter",
    description: "Melt spiced butter over charred paneer, releasing smoky paprika and citrus zest.",
    media:
      "https://images.pexels.com/photos/1860204/pexels-photo-1860204.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    title: "Plate with a flourish",
    description: "Swipe garlic yogurt, shower with fried curry leaves, and serve with neon heat.",
    media:
      "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
];

export function StepShowcase() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-10 md:px-12 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center text-balance">
        <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/80">Guided Cooking Flow</p>
        <h2 className="text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Swipe through sizzling chapters.
        </h2>
        <p className="mx-auto max-w-2xl text-base text-white/70 sm:text-lg">
          Foodiee choreographs motion, heat, and aroma — every step immerses you deeper into the
          dish, with imagery that crackles and steams as you cook.
        </p>
      </div>

      <div className="mt-16">
        <div className="hide-scrollbar -mx-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-10 pb-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="min-w-[280px] max-w-sm snap-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_25px_55px_-25px_rgba(255,90,47,0.45)] transition-transform duration-700 hover:-translate-y-1"
            >
              <div className="relative h-72 overflow-hidden rounded-t-3xl">
                <Image
                  src={step.media}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 280px, (max-width: 1280px) 320px, 360px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              </div>
              <div className="flex h-44 flex-col justify-between p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#FFD07F]/70">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{step.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
                  <span>Swipe →</span>
                  <span>Haptic Cue</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

