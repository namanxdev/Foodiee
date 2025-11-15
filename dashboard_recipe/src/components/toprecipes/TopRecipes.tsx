/**
 * TopRecipes Component
 * ====================
 * Main component for browsing and filtering top recipes
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Sparkles,
} from "lucide-react";
import RecipeCard from "./RecipeCard";
import RecipeFilters from "./RecipeFilters";
import RecipeDetailModal from "./RecipeDetailModal";
import VegetarianToggle from "@/components/VegetarianToggle";
import { useVegetarian } from "@/contexts/VegetarianContext";
import {
  RecipeFilters as IRecipeFilters,
  TopRecipeSummary,
  fetchTopRecipes,
} from "@/services/topRecipesApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TopRecipes() {
  const { isVegetarian } = useVegetarian();
  const [filters, setFilters] = useState<IRecipeFilters>({
    page: 1,
    page_size: 50,
    detailed: false,
    sort_by: "popularity_score",
    sort_order: "DESC",
  });

  const [recipes, setRecipes] = useState<TopRecipeSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // Update filters when vegetarian toggle changes
  useEffect(() => {
    if (isVegetarian) {
      // When vegetarian mode is ON, ensure "Vegetarian" is in dietary_tags
      setFilters((prevFilters) => {
        const currentTags = prevFilters.dietary_tags || [];
        if (!currentTags.includes("Vegetarian")) {
          return {
            ...prevFilters,
            dietary_tags: ["Vegetarian"],
            page: 1,
          };
        }
        return prevFilters;
      });
    } else {
      // When vegetarian mode is OFF, remove "Vegetarian" from dietary_tags if it's the only tag
      setFilters((prevFilters) => {
        if (prevFilters.dietary_tags?.length === 1 && prevFilters.dietary_tags[0] === 'Vegetarian') {
          return {
            ...prevFilters,
            dietary_tags: undefined,
            page: 1,
          };
        }
        return prevFilters;
      });
    }
  }, [isVegetarian]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchTopRecipes(filters);
      setRecipes(response.recipes as TopRecipeSummary[]);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load recipes");
      }
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch recipes whenever filters change
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleFilterChange = (newFilters: IRecipeFilters) => {
    setFilters(newFilters);
  };

  const handleRecipeClick = (recipe: TopRecipeSummary) => {
    setSelectedRecipeId(recipe.id);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-white/20 bg-white/5 text-white shadow-[0_24px_60px_-30px_rgba(255,90,47,0.45)] backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] text-[#1E1E1E] shadow-[0_18px_40px_-20px_rgba(255,90,47,0.75)]">
              <ChefHat className="h-7 w-7" />
            </span>
            <div>
              <CardTitle className="text-3xl font-semibold text-white">
                Foodiee&apos;s Top 50
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base text-white/75">
                Discover our curated collection of{" "}
                {totalCount ? totalCount.toLocaleString() : "thousands of"} recipes, ranked by
                flavor, ratings, and community love.
              </CardDescription>
            </div>
          </div>
          <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-[#FFD07F]">
            Updated Nightly
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <VegetarianToggle variant="filter" />
            {!loading && recipes.length > 0 && (
              <p className="text-sm text-white/60">
                Showing{" "}
                {((filters.page || 1) - 1) * (filters.page_size || 50) + 1} -{" "}
                {Math.min((filters.page || 1) * (filters.page_size || 50), totalCount)} of{" "}
                {totalCount.toLocaleString()} recipes
              </p>
            )}
          </div>

          <RecipeFilters filters={filters} onChange={handleFilterChange} />
        </CardContent>
      </Card>

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: Math.min(filters.page_size ?? 12, 12) }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20"
            >
              <div className="h-44 rounded-2xl bg-white/10" />
              <div className="mt-5 space-y-3">
                <div className="h-4 rounded-full bg-white/10" />
                <div className="h-4 w-2/3 rounded-full bg-white/10" />
                <div className="flex gap-2 pt-1">
                  <div className="h-7 w-20 rounded-full bg-white/10" />
                  <div className="h-7 w-16 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-3xl border border-red-400/40 bg-red-500/10 px-8 py-10 text-center text-sm text-red-100 shadow-[0_24px_60px_-30px_rgba(239,68,68,0.55)] backdrop-blur">
          <h3 className="text-2xl font-semibold text-red-200">Oops! Something went wrong</h3>
          <p className="mt-3">{error}</p>
          <Button
            onClick={loadRecipes}
            variant="gradient"
            className="mt-6 rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] px-6 text-[#1E1E1E]"
          >
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-white/80 shadow-inner shadow-black/20 backdrop-blur">
          <Sparkles className="mb-5 h-10 w-10 text-[#FFD07F]" />
          <h3 className="text-2xl font-semibold text-white">No recipes found</h3>
          <p className="mt-2 text-sm text-white/60">
            Try adjusting your filters or switching off vegetarian mode for now.
          </p>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {filters.page && filters.page > 3 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                      <span className="text-white/40">…</span>
                    </>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const currentPage = filters.page || 1;
                      return page >= currentPage - 2 && page <= currentPage + 2;
                    })
                    .map((page) => (
                      <Button
                        key={page}
                        variant={page === filters.page ? "gradient" : "ghost"}
                        size="sm"
                        className={
                          page === filters.page
                            ? "rounded-full px-5 text-[#1E1E1E]"
                            : "rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  {filters.page && filters.page < totalPages - 2 && (
                    <>
                      <span className="text-white/40">…</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  disabled={filters.page === totalPages}
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                Page {filters.page} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}

      <RecipeDetailModal recipeId={selectedRecipeId} onClose={() => setSelectedRecipeId(null)} />
    </div>
  );
}
