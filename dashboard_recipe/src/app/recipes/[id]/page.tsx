"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FancyFadeIn,
  FancyParticleLayer,
  FancySpotlight,
} from "@/components/animations/FancyComponents";
import { IngredientList } from "@/components/recipe/IngredientList";
import { StepReader } from "@/components/recipe/StepReader";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { RECIPE_LIBRARY_MOCKS } from "@/mock/recipes";

export default function RecipePage({ params }: { params: { id: string } }) {
  const recipe = RECIPE_LIBRARY_MOCKS.find(
    (item) => item.slug === params.id || item.id === params.id,
  );

  if (!recipe) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.25)_0%,_rgba(30,30,30,0.9)_45%,_rgba(10,10,10,1)_100%)] text-white">
      <FancyParticleLayer density={10} />
      <FancySpotlight size={420} blur={120} />

      <header className="relative mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-12 pt-16 sm:px-10 md:px-12 lg:px-16">
        <Link href="/recommendations" className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
          ← Back to recommendations
        </Link>
        <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/75">
          Step 3 · Cooking Flow
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl md:text-6xl">{recipe.title}</h1>
        <p className="max-w-3xl text-sm text-white/70 sm:text-base">{recipe.description}</p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-white/55">
          <span className="rounded-full border border-white/15 px-3 py-1">{recipe.cuisine}</span>
          <span className="rounded-full border border-white/15 px-3 py-1">{recipe.mealType}</span>
          <span className="rounded-full border border-white/15 px-3 py-1">{recipe.difficulty}</span>
          <span className="rounded-full border border-white/15 px-3 py-1">
            {recipe.totalTimeMinutes} mins
          </span>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 sm:px-10 md:px-12 lg:px-16">
        <div className="relative h-[420px] overflow-hidden rounded-[2.5rem] border border-white/10">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#0D0E10]" />
          <div className="absolute bottom-8 left-8 flex flex-col gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/40 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
              Cinematic AI Visual
            </div>
            <GlowingButton href="/images" label="Open gallery" />
          </div>
        </div>
      </section>

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-12 sm:px-10 md:px-12 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <StepReader steps={recipe.steps} recipeTitle={recipe.title} />
          <IngredientList ingredients={recipe.ingredients} servings={recipe.servings} />
        </div>

        <FancyFadeIn className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Equipment</p>
            <ul className="mt-4 space-y-2">
              {recipe.equipment.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-[#FFD07F]">✧</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Nutrition</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.35em]">
              <span>Calories {recipe.nutrition.calories}</span>
              <span>Protein {recipe.nutrition.protein}g</span>
              <span>Carbs {recipe.nutrition.carbohydrates}g</span>
              <span>Fat {recipe.nutrition.fat}g</span>
              {recipe.nutrition.fiber && <span>Fiber {recipe.nutrition.fiber}g</span>}
              {recipe.nutrition.sodium && <span>Sodium {recipe.nutrition.sodium}mg</span>}
            </div>
          </div>
        </FancyFadeIn>
      </main>
    </div>
  );
}

