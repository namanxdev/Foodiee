"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FancyFadeIn,
  FancyParallaxCard,
  FancyParticleLayer,
  FancySpotlight,
} from "@/components/animations/FancyComponents";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { RECIPE_LIBRARY_MOCKS } from "@/mock/recipes";

type FilterCategory = "All" | "Trending" | "Under 30" | "Vegetarian" | "High Protein";

const filterConfig: FilterCategory[] = ["All", "Trending", "Under 30", "Vegetarian", "High Protein"];

export default function RecommendationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  const filters = useMemo(() => {
    return [...new Set(RECIPE_LIBRARY_MOCKS.map((recipe) => recipe.cuisine))].slice(0, 8);
  }, []);

  const filteredRecipes = useMemo(() => {
    return RECIPE_LIBRARY_MOCKS.filter((recipe) => {
      switch (activeFilter) {
        case "Trending":
          return recipe.isTrending;
        case "Under 30":
          return recipe.totalTimeMinutes <= 30;
        case "Vegetarian":
          return recipe.dietary.includes("Vegetarian");
        case "High Protein":
          return recipe.dietary.includes("High-Protein");
        default:
          return true;
      }
    });
  }, [activeFilter]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.18)_0%,_rgba(30,30,30,0.92)_40%,_rgba(10,10,10,1)_100%)] text-white">
      <FancyParticleLayer density={12} />
      <FancySpotlight size={480} blur={120} />

      <header className="relative z-20 mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-12 pt-16 sm:px-10 md:px-12 lg:px-16">
        <Link href="/" className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
          ← Back to cinematic landing
        </Link>
        <FancyFadeIn>
          <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">
            Step 2 · Recommendations
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
            Tonight’s AI-curated menu.
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-white/70 sm:text-base">
            Foodiee choreographs these dishes from your cravings, pantry, and time. Hover to feel
            the heat, tap in to cook, and watch steps unfold with cinematic guidance.
          </p>
        </FancyFadeIn>
        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/15 bg-white/5 p-4 text-xs uppercase tracking-[0.35em] text-white/70">
          {filterConfig.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                className={`rounded-full px-5 py-2 transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E]"
                    : "border border-white/15 bg-white/10 text-white/70 hover:border-[#FFD07F]/45 hover:text-white"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            );
          })}
          <span className="hidden h-6 w-px bg-white/15 sm:inline-block" />
          <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/55">
            {filters.map((cuisine) => (
              <span key={cuisine} className="rounded-full border border-white/10 px-4 py-2">
                {cuisine}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-20 mx-auto grid w-full max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-2 sm:px-10 md:px-12 lg:px-16 xl:grid-cols-3">
        {filteredRecipes.map((recipe, index) => {
          const topPick = index === 0 && activeFilter === "All";
          return (
            <FancyParallaxCard
              key={recipe.id}
              intensity={12}
              className="min-h-[420px] overflow-hidden rounded-[2rem]"
            >
              <article className="relative flex h-full flex-col">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    className="object-cover transition-transform duration-[1200ms] hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute left-5 top-5 flex gap-3">
                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
                      {recipe.cuisine}
                    </span>
                    {topPick && (
                      <span className="rounded-full border border-[#FFD07F]/45 bg-[#FFD07F]/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-[#FFD07F] shadow-[0_0_35px_rgba(255,208,127,0.35)]">
                        Top pick
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-5 p-6 text-white">
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold">{recipe.title}</h2>
                    <p className="text-sm text-white/70">{recipe.description}</p>
                    <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/55">
                      <span>{recipe.totalTimeMinutes} mins</span>
                      <span>•</span>
                      <span>{recipe.difficulty}</span>
                      <span>•</span>
                      <span>{recipe.mealType}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-[#FFD07F]/85">
                      {recipe.dietary.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full border border-[#FFD07F]/30 px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <GlowingButton label="Cook this" href={`/recipes/${recipe.slug}`} />
                  </div>
                </div>
              </article>
            </FancyParallaxCard>
          );
        })}
      </main>
    </div>
  );
}

