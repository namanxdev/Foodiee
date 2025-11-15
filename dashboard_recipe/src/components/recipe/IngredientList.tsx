"use client";

import { useState } from "react";
import type { RecipeIngredient } from "@/types/library";
import { FancyFadeIn } from "@/components/animations/FancyComponents";

type IngredientListProps = {
  ingredients: RecipeIngredient[];
  servings: number;
};

export function IngredientList({ ingredients, servings }: IngredientListProps) {
  const [checked, setChecked] = useState<string[]>([]);

  const toggle = (name: string) => {
    setChecked((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  return (
    <aside className="sticky top-24">
      <FancyFadeIn className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#FFD07F]/80">
              Mise en place
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Ingredients</h3>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
            {servings} servings
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {ingredients.map((ingredient) => {
            const id = `${ingredient.name}-${ingredient.amount}`;
            const isChecked = checked.includes(id);

            return (
              <li
                key={id}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-[#FFD07F]/50 hover:bg-white/10"
              >
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-black/40 text-xs transition group-hover:border-[#FFD07F]/50 group-hover:text-[#FFD07F]"
                >
                  {isChecked ? "✓" : ""}
                </button>
                <div className="text-sm text-white/80">
                  <div className="font-medium text-white/95">
                    {ingredient.amount} · {ingredient.name}
                  </div>
                  {ingredient.preparation && (
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                      {ingredient.preparation}
                    </p>
                  )}
                  {ingredient.optional && (
                    <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/50">
                      Optional
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </FancyFadeIn>
    </aside>
  );
}

