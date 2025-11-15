"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Oven } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RecipeSummary, RecipeViewMode } from "@/types/library";
import { RecipeCard } from "./RecipeCard";
import { RecipeCardSkeleton } from "./RecipeCardSkeleton";

interface RecipeCollectionProps {
  recipes: RecipeSummary[];
  viewMode: RecipeViewMode;
  isLoading?: boolean;
  onSelectRecipe?: (recipe: RecipeSummary) => void;
  onCookRecipe?: (recipe: RecipeSummary) => void;
  onToggleFavorite?: (recipe: RecipeSummary, favorite: boolean) => void;
}

export function RecipeCollection({
  recipes,
  viewMode,
  isLoading,
  onSelectRecipe,
  onCookRecipe,
  onToggleFavorite,
}: RecipeCollectionProps) {
  const variant = viewMode === "grid" ? "expanded" : "compact";
  const gridClasses =
    viewMode === "grid"
      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      : "flex flex-col gap-4";

  if (!isLoading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-orange-50/30 p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        <Oven className="mb-4 h-10 w-10 text-orange-400 dark:text-orange-200" />
        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-200">No recipes found… yet.</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your filters or searching for a different ingredient or cuisine.
        </p>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className={cn("relative", gridClasses)}>
        {isLoading &&
          Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} variant={variant} />
          ))}

        <AnimatePresence mode="popLayout">
          {recipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              layout
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <RecipeCard
                recipe={recipe}
                variant={variant}
                onSelect={onSelectRecipe}
                onCook={onCookRecipe}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

