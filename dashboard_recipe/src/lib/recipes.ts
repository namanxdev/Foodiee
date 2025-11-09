"use client";

import {
  RECIPE_FACET_VALUES,
  RECIPE_LIBRARY_MOCKS,
  RECIPE_SUMMARY_MOCKS,
} from "@/mock/recipes";
import {
  FacetEntry,
  RecipeCollectionResponse,
  RecipeDetail,
  RecipeDifficulty,
  RecipeFacets,
  RecipeQueryParams,
  RecipeSort,
  RecipeSuggestion,
  RecipeSummary,
  ToggleFavoritePayload,
} from "@/types/library";
import { STORAGE_KEYS } from "@/constants";
import { getStorageItem, setStorageItem } from "@/utils/helpers";

const RECIPE_API_BASE = "/api/recipes";
const DEFAULT_PAGE_SIZE = 12;

function shouldUseMocks() {
  if (typeof window === "undefined") return true;
  const envFlag = window.localStorage.getItem("foodiee-use-mocks");
  if (envFlag) return envFlag !== "false";
  return process.env.NEXT_PUBLIC_USE_RECIPE_MOCKS !== "false";
}

function normalizeText(input: string) {
  return input.toLowerCase().trim();
}

function applyFilters(
  recipes: RecipeSummary[],
  query: RecipeQueryParams
): RecipeSummary[] {
  let filtered = recipes.slice();

  if (query.search) {
    const searchValue = normalizeText(query.search);
    filtered = filtered.filter((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description,
        recipe.cuisine,
        recipe.tags.join(" "),
        recipe.dietary.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchValue);
    });
  }

  if (query.cuisine) {
    filtered = filtered.filter(
      (recipe) => normalizeText(recipe.cuisine) === normalizeText(query.cuisine!)
    );
  }

  if (query.mealTypes?.length) {
    filtered = filtered.filter((recipe) =>
      query.mealTypes!.includes(recipe.mealType)
    );
  }

  if (query.dietary?.length) {
    filtered = filtered.filter((recipe) =>
      query.dietary!.every((tag) => recipe.dietary.includes(tag))
    );
  }

  if (query.difficulty?.length) {
    filtered = filtered.filter((recipe) =>
      query.difficulty!.includes(recipe.difficulty as RecipeDifficulty)
    );
  }

  if (query.maxTimeMinutes) {
    filtered = filtered.filter(
      (recipe) => recipe.totalTimeMinutes <= query.maxTimeMinutes!
    );
  }

  if (query.vegetarianOnly) {
    filtered = filtered.filter((recipe) => recipe.dietary.includes("Vegetarian"));
  }

  if (query.favoritesOnly) {
    const favoriteSet = getFavoriteIds();
    filtered = filtered.filter((recipe) => favoriteSet.has(recipe.id));
  }

  return filtered;
}

function applySort(recipes: RecipeSummary[], sort: RecipeSort = "relevance") {
  const sorted = recipes.slice();
  switch (sort) {
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "time":
      sorted.sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
      break;
    case "new":
      sorted.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
      break;
    case "difficulty":
      const order: Record<RecipeDifficulty, number> = {
        Easy: 0,
        Medium: 1,
        Hard: 2,
      };
      sorted.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
      break;
    case "favorites":
      sorted.sort((a, b) => Number(b.favorite ?? false) - Number(a.favorite ?? false));
      break;
    default:
      sorted.sort(
        (a, b) =>
          Number(b.isTrending ?? false) - Number(a.isTrending ?? false) ||
          b.ratingCount - a.ratingCount
      );
  }
  return sorted;
}

function paginate(
  recipes: RecipeSummary[],
  page: number,
  pageSize: number
) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return recipes.slice(start, end);
}

function createFacets(
  recipes: RecipeSummary[],
  active: RecipeQueryParams
): RecipeFacets {
  const makeFacet = (values: string[], selected: string[] = []) => {
    const counts: Record<string, number> = {};
    values.forEach((value) => (counts[value] = 0));

    recipes.forEach((recipe) => {
      values.forEach((value) => {
        const normalized = normalizeText(value);
        const matches =
          normalizeText(recipe.cuisine) === normalized ||
          recipe.mealType === value ||
          recipe.tags.some((tag) => normalizeText(tag) === normalized) ||
          recipe.dietary.some((tag) => normalizeText(tag) === normalized) ||
          recipe.difficulty === value;

        if (matches) {
          counts[value] = (counts[value] ?? 0) + 1;
        }
      });
    });

    return values.map<FacetEntry>((value) => ({
      value,
      count: counts[value] ?? 0,
      selected: selected.includes(value),
    }));
  };

  return {
    cuisines: makeFacet(
      RECIPE_FACET_VALUES.cuisines,
      active.cuisine ? [active.cuisine] : []
    ),
    mealTypes: makeFacet(
      RECIPE_FACET_VALUES.mealTypes,
      active.mealTypes ?? []
    ),
    dietary: makeFacet(
      RECIPE_FACET_VALUES.dietaryTags,
      active.dietary ?? []
    ),
    difficulty: makeFacet(
      RECIPE_FACET_VALUES.difficulties,
      active.difficulty ?? []
    ),
    tags: makeFacet(
      Array.from(
        new Set(RECIPE_SUMMARY_MOCKS.flatMap((recipe) => recipe.tags))
      ),
      active.mealTypes ?? []
    ),
  };
}

function getFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(
    getStorageItem<string[]>(STORAGE_KEYS.LAST_RECIPE + ":favorites", [])
  );
}

function persistFavorite(id: string, favorite: boolean) {
  if (typeof window === "undefined") return;
  const current = getFavoriteIds();
  if (favorite) {
    current.add(id);
  } else {
    current.delete(id);
  }
  setStorageItem(
    STORAGE_KEYS.LAST_RECIPE + ":favorites",
    Array.from(current.values())
  );
}

export async function fetchRecipeCollection(
  query: RecipeQueryParams = {},
  useMockOverride?: boolean
): Promise<RecipeCollectionResponse> {
  const useMock = useMockOverride ?? shouldUseMocks();

  if (!useMock) {
    try {
      const params = new URLSearchParams();
      if (query.search) params.set("search", query.search);
      if (query.cuisine) params.set("cuisine", query.cuisine);
      if (query.mealTypes?.length) params.set("mealTypes", query.mealTypes.join(","));
      if (query.dietary?.length) params.set("dietary", query.dietary.join(","));
      if (query.difficulty?.length) params.set("difficulty", query.difficulty.join(","));
      if (query.maxTimeMinutes)
        params.set("maxTimeMinutes", query.maxTimeMinutes.toString());
      if (query.sort) params.set("sort", query.sort);
      if (query.page) params.set("page", query.page.toString());
      if (query.pageSize) params.set("pageSize", query.pageSize.toString());
      if (query.vegetarianOnly) params.set("vegetarianOnly", "true");
      if (query.favoritesOnly) params.set("favoritesOnly", "true");

      const response = await fetch(`${RECIPE_API_BASE}?${params.toString()}`, {
        next: { revalidate: 60 },
      });
      if (response.ok) {
        return response.json();
      }
      console.warn("[recipes] Falling back to mocks due to API error", response.status);
    } catch (error) {
      console.warn("[recipes] API fetch failed, using mocks", error);
    }
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const favorites = getFavoriteIds();

  const filtered = applyFilters(
    RECIPE_SUMMARY_MOCKS.map((summary) => ({
      ...summary,
      favorite: favorites.has(summary.id),
    })),
    query
  );
  const sorted = applySort(filtered, query.sort);
  const paged = paginate(sorted, page, pageSize);
  const suggestions = buildSuggestions(query.search ?? "", sorted);

  return {
    items: paged,
    total: filtered.length,
    page,
    pageSize,
    hasMore: page * pageSize < filtered.length,
    suggestions,
    facets: createFacets(filtered, query),
  };
}

export async function fetchRecipeDetail(
  id: string,
  useMockOverride?: boolean
): Promise<RecipeDetail> {
  const useMock = useMockOverride ?? shouldUseMocks();

  if (!useMock) {
    try {
      const response = await fetch(`${RECIPE_API_BASE}/${id}`);
      if (response.ok) {
        return response.json();
      }
      console.warn("[recipes] Received non-ok response, using mock detail.", response.status);
    } catch (error) {
      console.warn("[recipes] Detail fetch failed, using mock", error);
    }
  }

  const favorites = getFavoriteIds();
  const detail = RECIPE_LIBRARY_MOCKS.find((recipe) => recipe.id === id);
  if (!detail) {
    throw new Error("Recipe not found");
  }
  return {
    ...detail,
    favorite: favorites.has(id),
  };
}

export async function toggleRecipeFavorite(
  payload: ToggleFavoritePayload
): Promise<void> {
  persistFavorite(payload.recipeId, payload.favorite);

  if (shouldUseMocks()) {
    return;
  }

  try {
    await fetch(`${RECIPE_API_BASE}/${payload.recipeId}/favorite`, {
      method: payload.favorite ? "POST" : "DELETE",
    });
  } catch (error) {
    console.warn("[recipes] Failed to persist favorite with API, retaining local only.", error);
  }
}

export async function fetchRecipeSuggestions(
  search: string,
  limit = 6
): Promise<RecipeSuggestion[]> {
  if (!search) return [];

  if (!shouldUseMocks()) {
    try {
      const response = await fetch(
        `${RECIPE_API_BASE}/suggest?query=${encodeURIComponent(search)}&limit=${limit}`
      );
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.warn("[recipes] Suggestion fetch failed, using mock data", error);
    }
  }

  return buildSuggestions(search, RECIPE_SUMMARY_MOCKS, limit);
}

function buildSuggestions(
  search: string,
  collection: RecipeSummary[],
  limit = 6
): RecipeSuggestion[] {
  if (!search) return [];
  const value = normalizeText(search);

  return collection
    .filter((item) => normalizeText(item.title).includes(value))
    .slice(0, limit)
    .map<RecipeSuggestion>((item) => ({
      id: item.id,
      title: item.title,
      highlight: item.cuisine,
      icon: item.difficulty.toLowerCase(),
    }));
}

export const recipeLibraryApi = {
  fetchRecipeCollection,
  fetchRecipeDetail,
  fetchRecipeSuggestions,
  toggleRecipeFavorite,
};

export type { RecipeSummary, RecipeDetail } from "@/types/library";

