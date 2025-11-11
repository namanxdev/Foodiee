"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FancyFadeIn,
  FancyParticleLayer,
  FancyStagger,
  FancySpotlight,
} from "@/components/animations/FancyComponents";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { RECIPE_LIBRARY_MOCKS } from "@/mock/recipes";

const shimmerVariants = ["Warm Ember", "Neon Spice", "Smoked Citrus", "Velvet Night"];

export default function ImageGalleryPage() {
  const [selectedShimmer, setSelectedShimmer] = useState("Warm Ember");

  const gallery = useMemo(
    () =>
      RECIPE_LIBRARY_MOCKS.flatMap((recipe) =>
        recipe.steps.map((step, index) => ({
          id: `${recipe.id}-${index}`,
          recipeTitle: recipe.title,
          stepTitle: step.title,
          description: step.instruction,
          image: recipe.image,
        })),
      ).slice(0, 18),
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.18)_0%,_rgba(30,30,30,0.95)_45%,_rgba(10,10,10,1)_100%)] text-white">
      <FancyParticleLayer density={18} />
      <FancySpotlight size={440} blur={140} />

      <header className="relative z-20 mx-auto max-w-6xl px-6 pb-12 pt-16 sm:px-10 md:px-12 lg:px-16">
        <Link href="/" className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
          ← Back to cinematic landing
        </Link>
        <FancyFadeIn className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">
            AI image gallery
          </p>
          <h1 className="text-4xl font-semibold sm:text-5xl md:text-6xl">
            Hover to taste the scene.
          </h1>
          <p className="max-w-3xl text-sm text-white/70 sm:text-base">
            Foodiee spins up cinematic dish visuals with neon glows and steam trails. Scroll,
            tilt, and shimmer the gallery while the AI readies fresh plates on demand.
          </p>
        </FancyFadeIn>
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs uppercase tracking-[0.35em] text-white/65">
          {shimmerVariants.map((variant) => (
            <button
              key={variant}
              onClick={() => setSelectedShimmer(variant)}
              className={`rounded-full px-4 py-2 transition ${
                selectedShimmer === variant
                  ? "bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E]"
                  : "border border-white/15 bg-white/10 text-white/70 hover:border-[#FFD07F]/45 hover:text-white"
              }`}
            >
              {variant}
            </button>
          ))}
          <span className="hidden h-6 w-px bg-white/15 sm:inline-flex" />
          <GlowingButton label="Generate new" href="/preferences" />
        </div>
      </header>

      <main className="relative z-20 mx-auto max-w-6xl px-6 pb-24 sm:px-10 md:px-12 lg:px-16">
        <FancyStagger className="columns-1 gap-4 space-y-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {gallery.map((item, index) => (
            <figure
              key={item.id}
              className="group relative mb-4 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl transition duration-500 hover:-translate-y-2 hover:shadow-[0_25px_55px_-22px_rgba(255,90,47,0.55)]"
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={item.image}
                  alt={item.stepTitle}
                  fill
                  className="object-cover transition-transform duration-[1400ms] group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 translate-y-8 bg-gradient-to-t from-black/75 via-black/45 to-transparent p-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#FFD07F]/75">
                    {item.recipeTitle}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{item.stepTitle}</h3>
                  <p className="mt-3 text-sm text-white/70 line-clamp-3">{item.description}</p>
                </div>
                <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                  Shot {index + 1}
                </span>
              </div>
            </figure>
          ))}
        </FancyStagger>
      </main>
    </div>
  );
}

