"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/components/layout/Header";
import { AppFooter } from "@/components/landing/AppFooter";
import {
  KeyboardShortcutsDialog,
  LibraryToolbar,
  RecipeCollection,
} from "@/components/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  fetchRecipeCollection,
  fetchRecipeDetail,
  fetchRecipeSuggestions,
  toggleRecipeFavorite,
} from "@/lib/recipes";
import { useDebounce } from "@/hooks";
import type {
  RecipeCollectionResponse,
  RecipeDetail,
  RecipeQueryParams,
  RecipeFacets,
  RecipeSuggestion,
  RecipeSummary,
} from "@/types/library";
import type { LibraryFiltersState } from "@/components/library/types";

const INITIAL_FILTERS: LibraryFiltersState = {
  search: "",
  cuisine: undefined,
  mealTypes: [],
  dietary: [],
  difficulty: [],
  maxTimeMinutes: undefined,
  favoritesOnly: false,
  vegetarianOnly: false,
  sort: "relevance",
  pageSize: 12,
  viewMode: "grid",
};

export default function LibraryPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<LibraryFiltersState>(INITIAL_FILTERS);
  const [collection, setCollection] = useState<RecipeCollectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(filters.search ?? "", 300);

  const queryParams: RecipeQueryParams = useMemo(
    () => ({
      search: debouncedSearch,
      cuisine: filters.cuisine,
      mealTypes: filters.mealTypes,
      dietary: filters.dietary,
      difficulty: filters.difficulty,
      favoritesOnly: filters.favoritesOnly,
      vegetarianOnly: filters.vegetarianOnly,
      sort: filters.sort,
      maxTimeMinutes: filters.maxTimeMinutes,
      pageSize: filters.pageSize,
    }),
    [
      debouncedSearch,
      filters.cuisine,
      filters.mealTypes,
      filters.dietary,
      filters.difficulty,
      filters.favoritesOnly,
      filters.vegetarianOnly,
      filters.sort,
      filters.maxTimeMinutes,
      filters.pageSize,
    ]
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetchRecipeCollection(queryParams)
      .then((response) => {
        if (!active) return;
        setCollection(response);
      })
      .catch((error) => {
        console.error("[library] Failed to load recipes", error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryParams]);

  useEffect(() => {
    let active = true;
    const term = filters.search ?? "";
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    fetchRecipeSuggestions(term, 8)
      .then((items) => {
        if (active) {
          setSuggestions(items);
        }
      })
      .catch((error) => {
        console.warn("[library] Failed to fetch suggestions", error);
      });

    return () => {
      active = false;
    };
  }, [filters.search]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.shiftKey && event.key === "?") {
        event.preventDefault();
        setShortcutOpen(true);
        return;
      }

      if (isInputTarget) return;

      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key.toLowerCase() === "f") {
          event.preventDefault();
          updateFilters({ favoritesOnly: !filters.favoritesOnly });
        }
        if (event.key.toLowerCase() === "v") {
          event.preventDefault();
          updateFilters({ vegetarianOnly: !filters.vegetarianOnly });
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [filters.favoritesOnly, filters.vegetarianOnly]);

  const updateFilters = (delta: Partial<LibraryFiltersState>) => {
    setFilters((prev) => ({
      ...prev,
      ...delta,
      mealTypes: delta.mealTypes ?? prev.mealTypes,
      dietary: delta.dietary ?? prev.dietary,
      difficulty: delta.difficulty ?? prev.difficulty,
      viewMode: delta.viewMode ?? prev.viewMode,
      cuisine: delta.cuisine !== undefined ? delta.cuisine : prev.cuisine,
      maxTimeMinutes:
        delta.maxTimeMinutes !== undefined
          ? delta.maxTimeMinutes
          : prev.maxTimeMinutes,
      favoritesOnly:
        delta.favoritesOnly !== undefined ? delta.favoritesOnly : prev.favoritesOnly,
      vegetarianOnly:
        delta.vegetarianOnly !== undefined
          ? delta.vegetarianOnly
          : prev.vegetarianOnly,
      sort: delta.sort ?? prev.sort,
      search: delta.search !== undefined ? delta.search : prev.search,
    }));
  };

  const handleSelectRecipe = (recipe: RecipeSummary) => {
    setSelectedRecipe(recipe);
    setDetailLoading(true);
    setDetailOpen(true);

    fetchRecipeDetail(recipe.id)
      .then((data) => {
        setDetail(data);
      })
      .catch((error) => {
        console.error("[library] Failed to load recipe detail", error);
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

const handleCookRecipe = (recipe: RecipeSummary | RecipeDetail) => {
    console.info("Starting mock cooking session for recipe:", recipe.title);
  };

  const handleFavoriteToggle = (recipe: RecipeSummary, favorite: boolean) => {
    setCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === recipe.id ? { ...item, favorite } : item
        ),
      };
    });

    if (detail?.id === recipe.id) {
      setDetail({ ...detail, favorite });
    }

    toggleRecipeFavorite({ recipeId: recipe.id, favorite }).catch((error) => {
      console.warn("[library] Failed to persist favorite", error);
    });
  };

  const totalRecipes = collection?.total ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header session={session ?? null} />

      <main className="flex flex-1 flex-col gap-10 pb-16 pt-10">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:px-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Recipe Library
            </h1>
            <p className="text-sm text-slate-500 sm:text-base">
              Browse AI-curated recipes tailored to your pantry, preferences, and pace.
              Mix & match cuisines, filter by dietary needs, and save your favorites for
              later.
            </p>
          </header>

          <LibraryToolbar
            filters={{ ...filters }}
            facets={collection?.facets ?? DEFAULT_FACETS}
            searchSuggestions={suggestions}
            onFiltersChange={updateFilters}
            onSuggestionSelect={(suggestion) =>
              updateFilters({ search: suggestion.title })
            }
            loading={isLoading}
            searchInputRef={searchInputRef}
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing{" "}
              <strong className="text-slate-600">
                {collection?.items.length ?? 0}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-600">
                {totalRecipes.toLocaleString(undefined)}
              </strong>{" "}
              recipes
            </span>
            <span>{(filters.sort ?? "relevance").replace("-", " ")}</span>
          </div>

          <RecipeCollection
            recipes={collection?.items ?? []}
            viewMode={filters.viewMode}
            isLoading={isLoading}
            onSelectRecipe={handleSelectRecipe}
            onCookRecipe={handleCookRecipe}
            onToggleFavorite={handleFavoriteToggle}
          />
        </section>
      </main>

      <AppFooter />

      <KeyboardShortcutsDialog open={shortcutOpen} onOpenChange={setShortcutOpen} />

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetail(null);
            setSelectedRecipe(null);
          }
        }}
      >
        <DialogContent size="lg" className="max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900">
              {detail?.title ?? selectedRecipe?.title ?? "Loading recipe…"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex flex-col gap-4">
              <div className="h-48 animate-pulse rounded-3xl bg-orange-100" />
              <div className="space-y-3">
                <div className="h-4 animate-pulse rounded-lg bg-orange-100" />
                <div className="h-4 animate-pulse rounded-lg bg-orange-100" />
                <div className="h-4 animate-pulse rounded-lg bg-orange-100" />
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div
                  className="relative h-48 w-full overflow-hidden rounded-3xl border border-orange-100/60 bg-orange-50/40"
                  style={{
                    backgroundImage: `url(${detail.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  aria-hidden
                />

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-orange-100 text-orange-600">Prep {detail.prepTimeMinutes} mins</Badge>
                  <Badge className="bg-orange-100 text-orange-600">Cook {detail.cookTimeMinutes} mins</Badge>
                  <Badge className="bg-slate-100 text-slate-500">
                    Serves {detail.servings}
                  </Badge>
                  <Badge className="bg-green-100 text-green-600">
                    {detail.difficulty}
                  </Badge>
                </div>

                <p className="text-sm text-slate-500">{detail.description}</p>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Ingredients
                  </h3>
                  <Separator className="my-2 bg-orange-100" />
                  <ul className="grid gap-2 md:grid-cols-2">
                    {detail.ingredients.map((ingredient) => (
                      <li
                        key={ingredient.name}
                        className="rounded-2xl border border-orange-100/60 bg-orange-50/40 px-4 py-3 text-sm text-slate-600"
                      >
                        <span className="font-medium text-slate-700">
                          {ingredient.amount}
                        </span>{" "}
                        {ingredient.name}
                        {ingredient.preparation && (
                          <span className="text-slate-400">
                            {" "}
                            · {ingredient.preparation}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Steps
                  </h3>
                  <Separator className="my-2 bg-orange-100" />
                  <ol className="space-y-3">
                    {detail.steps.map((step, index) => (
                      <li
                        key={step.id}
                        className="rounded-2xl border border-orange-100/60 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
                      >
                        <span className="font-semibold text-orange-500">
                          Step {index + 1}
                        </span>
                        <p className="mt-1 text-slate-600">{step.instruction}</p>
                        {step.tip && (
                          <p className="mt-2 rounded-2xl bg-orange-50/80 p-3 text-xs text-orange-600">
                            Tip: {step.tip}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="space-y-3 rounded-3xl border border-orange-100/60 bg-orange-50/40 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Nutrition (per serving)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <NutritionBadge label="Calories" value={`${detail.nutrition.calories} kcal`} />
                    <NutritionBadge label="Protein" value={`${detail.nutrition.protein} g`} />
                    <NutritionBadge label="Carbs" value={`${detail.nutrition.carbohydrates} g`} />
                    <NutritionBadge label="Fat" value={`${detail.nutrition.fat} g`} />
                  </div>
                </section>

                <div className="flex items-center justify-between rounded-3xl border border-orange-100/60 bg-white p-4 shadow-sm">
                  <div className="text-sm text-slate-400">
                    Created by{" "}
                    <span className="font-semibold text-slate-600">
                      {detail.author.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-2xl px-5"
                    onClick={() => handleCookRecipe(detail)}
                  >
                    Start cook session
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NutritionBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-500">
      <span className="block text-xs uppercase tracking-wide text-slate-300">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-600">{value}</span>
    </div>
  );
}

const DEFAULT_FACETS: RecipeFacets = {
  cuisines: [],
  mealTypes: [],
  dietary: [],
  difficulty: [],
  tags: [],
};

