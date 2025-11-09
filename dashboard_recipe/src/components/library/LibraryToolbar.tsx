"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { RefObject } from "react";
import {
  Filter,
  Grid,
  Heart,
  LayoutList,
  Search,
  SlidersHorizontal,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  FacetEntry,
  RecipeDietaryTag,
  RecipeFacets,
  RecipeMealType,
  RecipeQueryParams,
  RecipeSort,
  RecipeSuggestion,
  RecipeViewMode,
} from "@/types/library";
import type { LibraryFilterChange } from "./types";

interface LibraryToolbarProps {
  filters: Pick<
    RecipeQueryParams,
    | "search"
    | "cuisine"
    | "mealTypes"
    | "dietary"
    | "difficulty"
    | "maxTimeMinutes"
    | "favoritesOnly"
    | "vegetarianOnly"
    | "sort"
  > & { viewMode: RecipeViewMode };
  facets: RecipeFacets;
  searchSuggestions: RecipeSuggestion[];
  onFiltersChange: (delta: LibraryFilterChange) => void;
  onSearchCommit: (value: string) => void;
  onSuggestionSelect: (suggestion: RecipeSuggestion) => void;
  onOpenFilters?: () => void;
  loading?: boolean;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export function LibraryToolbar({
  filters,
  facets,
  searchSuggestions,
  onFiltersChange,
  onSearchCommit,
  onSuggestionSelect,
  onOpenFilters,
  loading,
  searchInputRef,
}: LibraryToolbarProps) {
  const inputId = useId();
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (filters.cuisine) chips.push(filters.cuisine);
    if (filters.mealTypes?.length)
      chips.push(...filters.mealTypes.map((type) => `#${type}`));
    if (filters.dietary?.length)
      chips.push(...filters.dietary.map((diet) => diet));
    if (filters.difficulty?.length)
      chips.push(...filters.difficulty.map((difficulty) => difficulty));
    if (filters.maxTimeMinutes) chips.push(`≤ ${filters.maxTimeMinutes} mins`);
    if (filters.favoritesOnly) chips.push("Favorites");
    if (filters.vegetarianOnly) chips.push("Vegetarian");
    return chips;
  }, [
    filters.cuisine,
    filters.mealTypes,
    filters.dietary,
    filters.difficulty,
    filters.maxTimeMinutes,
    filters.favoritesOnly,
    filters.vegetarianOnly,
  ]);

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ search: value });
    onSearchCommit(value);
  };

  const handleSuggestionClick = (suggestion: RecipeSuggestion) => {
    setSearchValue(suggestion.title);
    setShowSuggestions(false);
    onFiltersChange({ search: suggestion.title });
    onSuggestionSelect(suggestion);
  };

  const handleToggle = (field: "favoritesOnly" | "vegetarianOnly") => {
    onFiltersChange({ [field]: !filters[field] });
  };

  const handleMealTypeChange = (value: RecipeMealType) => {
    const current = new Set(filters.mealTypes ?? []);
    current.has(value) ? current.delete(value) : current.add(value);
    onFiltersChange({ mealTypes: Array.from(current) });
  };

  const handleDietaryChange = (value: RecipeDietaryTag) => {
    const current = new Set(filters.dietary ?? []);
    current.has(value) ? current.delete(value) : current.add(value);
    onFiltersChange({ dietary: Array.from(current) });
  };

  const isSuggestionMenuVisible = showSuggestions && searchSuggestions.length > 0;

  return (
    <div className="space-y-4 rounded-3xl border border-orange-100/60 bg-white/90 p-4 shadow-sm shadow-brand/10 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xl">
          <Input
            ref={searchInputRef}
            id={inputId}
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              onFiltersChange({ search: event.target.value });
              setShowSuggestions(true);
            }}
            onFocus={() =>
              searchSuggestions.length ? setShowSuggestions(true) : null
            }
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 120);
            }}
            placeholder="Search recipes, ingredients, or keywords…"
            className="h-12 rounded-2xl border-orange-100 bg-white pl-11 text-sm shadow-sm"
            aria-autocomplete="list"
            aria-controls={`${inputId}-suggestions`}
            aria-expanded={isSuggestionMenuVisible}
            autoComplete="off"
          />
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />

          {isSuggestionMenuVisible && (
            <div
              id={`${inputId}-suggestions`}
              role="listbox"
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg shadow-brand/20"
            >
              <ScrollArea className="max-h-60">
                {searchSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.id}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span>{suggestion.title}</span>
                    {suggestion.highlight && (
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {suggestion.highlight}
                      </span>
                    )}
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button
            type="button"
            variant={filters.favoritesOnly ? "gradient" : "ghost"}
            className={cn(
              "rounded-2xl px-4 text-sm",
              filters.favoritesOnly
                ? "shadow-brand-glow text-white"
                : "text-slate-500"
            )}
            onClick={() => handleToggle("favoritesOnly")}
            aria-pressed={filters.favoritesOnly}
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Button>
          <Button
            type="button"
            variant={filters.vegetarianOnly ? "gradient" : "ghost"}
            className={cn(
              "rounded-2xl px-4 text-sm",
              filters.vegetarianOnly
                ? "shadow-brand-glow text-white"
                : "text-slate-500"
            )}
            onClick={() => handleToggle("vegetarianOnly")}
            aria-pressed={filters.vegetarianOnly}
          >
            <Filter className="mr-2 h-4 w-4" />
            Veg Mode
          </Button>
          <ViewToggle
            view={filters.viewMode}
            onChange={(view) => onFiltersChange({ viewMode: view })}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-2xl border-orange-100 text-slate-500 hover:bg-orange-50 md:hidden"
            onClick={onOpenFilters}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="bg-orange-100" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <FacetChipSelect
            label="Cuisine"
            values={facets.cuisines}
            selectedValue={filters.cuisine}
            onSelect={(value) =>
              onFiltersChange({
                cuisine: value === filters.cuisine ? undefined : value,
              })
            }
          />
          <FacetMultiSelect
            label="Meal Type"
            values={facets.mealTypes}
            selected={filters.mealTypes ?? []}
            onToggle={handleMealTypeChange}
          />
          <FacetMultiSelect
            label="Dietary"
            values={facets.dietary}
            selected={filters.dietary ?? []}
            onToggle={handleDietaryChange}
          />
          <FacetMultiSelect
            label="Difficulty"
            values={facets.difficulty}
            selected={filters.difficulty ?? []}
            onToggle={(difficulty) => {
              const current = new Set(filters.difficulty ?? []);
              current.has(difficulty)
                ? current.delete(difficulty)
                : current.add(difficulty);
              onFiltersChange({ difficulty: Array.from(current) });
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl border border-orange-100 text-xs text-slate-500 hover:bg-orange-50"
            onClick={() => onFiltersChange({ maxTimeMinutes: undefined })}
          >
            <Timer className="mr-2 h-4 w-4 text-orange-500" />
            {filters.maxTimeMinutes ? `≤ ${filters.maxTimeMinutes} mins` : "Any time"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-400">Sort by</label>
          <SortSelect
            value={filters.sort ?? "relevance"}
            onChange={(sort) => onFiltersChange({ sort })}
          />
          {(activeFilters.length > 0 || filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-2xl text-xs text-slate-500 hover:text-orange-500"
              onClick={() =>
                onFiltersChange({
                  cuisine: undefined,
                  mealTypes: [],
                  dietary: [],
                  difficulty: [],
                  maxTimeMinutes: undefined,
                  favoritesOnly: false,
                  vegetarianOnly: false,
                  search: "",
                })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <>
          <Separator className="bg-orange-100" />
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <Badge
                key={chip}
                className="rounded-full bg-white text-xs font-medium text-slate-500 ring-1 ring-orange-100"
              >
                {chip}
              </Badge>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="text-xs uppercase tracking-[0.3em] text-orange-400">
          Updating library…
        </div>
      )}

      <Separator className="bg-transparent" />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Press{" "}
          <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase">
            ?
          </kbd>{" "}
          for keyboard shortcuts
        </span>
        <span>
          Results view:{" "}
          <strong className="text-slate-500">{filters.viewMode.toUpperCase()}</strong>
        </span>
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: RecipeViewMode;
  onChange: (view: RecipeViewMode) => void;
}) {
  const isGrid = view === "grid";
  return (
    <div className="flex overflow-hidden rounded-2xl border border-orange-100 bg-white/80 text-slate-500 shadow-sm">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all",
          isGrid && "bg-orange-50 text-orange-600"
        )}
        onClick={() => onChange("grid")}
        aria-pressed={isGrid}
      >
        <Grid className="h-3.5 w-3.5" />
        Grid
      </button>
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all",
          !isGrid && "bg-orange-50 text-orange-600"
        )}
        onClick={() => onChange("list")}
        aria-pressed={!isGrid}
      >
        <LayoutList className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}

interface FacetChipSelectProps {
  label: string;
  values: RecipeFacets["cuisines"];
  selectedValue?: string;
  onSelect: (value: string | undefined) => void;
}

function FacetChipSelect({
  label,
  values,
  selectedValue,
  onSelect,
}: FacetChipSelectProps) {
  const filteredValues = values.filter((item) => item.count > 0 || item.selected);

  if (!filteredValues.length) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {filteredValues.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              item.value === selectedValue
                ? "border-orange-400 bg-orange-50 text-orange-600"
                : "border-transparent bg-slate-100 text-slate-500 hover:bg-orange-50"
            )}
          >
            {item.value}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FacetMultiSelectProps<T extends string> {
  label: string;
  values: FacetEntry[];
  selected: T[];
  onToggle: (value: T) => void;
}

function FacetMultiSelect<T extends string>({
  label,
  values,
  selected,
  onToggle,
}: FacetMultiSelectProps<T>) {
  const filteredValues = values.filter((item) => item.count > 0 || item.selected);
  if (!filteredValues.length) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {filteredValues.map((item) => {
          const typedValue = item.value as T;
          const isActive = selected.includes(typedValue);
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onToggle(typedValue)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-orange-400 bg-orange-50 text-orange-600"
                  : "border-transparent bg-slate-100 text-slate-500 hover:bg-orange-50"
              )}
            >
              {item.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SORT_OPTIONS: { value: RecipeSort; label: string }[] = [
  { value: "relevance", label: "Most relevant" },
  { value: "rating", label: "Highest rated" },
  { value: "time", label: "Quickest" },
  { value: "new", label: "Newest" },
  { value: "difficulty", label: "Difficulty" },
  { value: "favorites", label: "Saved first" },
];

function SortSelect({
  value,
  onChange,
}: {
  value: RecipeSort;
  onChange: (value: RecipeSort) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RecipeSort)}
        className="h-10 rounded-2xl border border-orange-100 bg-white px-4 text-sm text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

