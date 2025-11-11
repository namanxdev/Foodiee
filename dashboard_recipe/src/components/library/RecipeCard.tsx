"use client";

import {
  CalendarDays,
  Clock,
  Flame,
  Heart,
  HeartOff,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecipeSummary } from "@/types/library";

export type RecipeCardVariant = "compact" | "expanded";

interface RecipeCardProps {
  recipe: RecipeSummary;
  onSelect?: (recipe: RecipeSummary) => void;
  onCook?: (recipe: RecipeSummary) => void;
  onToggleFavorite?: (recipe: RecipeSummary, favorite: boolean) => void;
  variant?: RecipeCardVariant;
  className?: string;
}

export function RecipeCard({
  recipe,
  onSelect,
  onCook,
  onToggleFavorite,
  variant = "expanded",
  className,
}: RecipeCardProps) {
  const isFavorite = Boolean(recipe.favorite);
  const displayVariant = variant;

  const handleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleFavorite?.(recipe, !isFavorite);
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("group h-full", className)}
    >
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-3xl border border-orange-100/60 bg-white/95 transition-all hover:-translate-y-1 hover:shadow-brand dark:border-slate-700 dark:bg-slate-900/85",
          displayVariant === "compact" && "flex-row gap-4 p-4"
        )}
        onClick={() => onSelect?.(recipe)}
        role="button"
        aria-pressed="false"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect?.(recipe);
          }
        }}
      >
        <CardHeader
          className={cn(
            "relative rounded-2xl border border-orange-100/60 bg-orange-50/40 p-0 dark:border-orange-500/40 dark:bg-orange-500/10",
            displayVariant === "compact"
              ? "h-40 w-40 overflow-hidden"
              : "h-48 w-full overflow-hidden"
          )}
        >
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 320px, 50vw"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-white">
            <CardTitle className="text-lg font-semibold leading-tight">
              {recipe.title}
            </CardTitle>
            <CardDescription className="text-xs text-white/70">
              {recipe.cuisine} · {recipe.difficulty}
            </CardDescription>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-2">
            {recipe.isTrending && (
              <Badge className="flex items-center gap-1 bg-white/90 text-orange-600 shadow-sm dark:bg-orange-500/20 dark:text-orange-200">
                <Sparkles className="h-3 w-3" /> Trending
              </Badge>
            )}
            <Button
              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
              variant="ghost"
              size="icon"
              className="rounded-2xl bg-white/80 text-orange-500 hover:bg-white dark:bg-slate-900/70 dark:text-orange-200 dark:hover:bg-slate-700"
              onClick={handleFavorite}
            >
              {isFavorite ? (
                <Heart className="h-4 w-4 fill-orange-500" />
              ) : (
                <HeartOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "flex flex-1 flex-col gap-4 p-5",
            displayVariant === "compact" && "p-0 pl-4"
          )}
        >
          <div className="space-y-2">
            {displayVariant === "compact" && (
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {recipe.title}
              </CardTitle>
            )}
            <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
              {recipe.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="glow"
              className="flex items-center gap-1 bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200"
            >
              <Clock className="h-3.5 w-3.5" />
              {recipe.totalTimeMinutes} mins
            </Badge>
            <Badge className="bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-200">
              <Utensils className="mr-1 h-3.5 w-3.5" />
              Serves {recipe.servings}
            </Badge>
            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
              <Flame className="mr-1 h-3.5 w-3.5" />
              {recipe.difficulty}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                className="rounded-full bg-white text-xs font-medium text-slate-500 ring-1 ring-orange-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter
          className={cn(
            "flex flex-col gap-3 border-t border-orange-100/60 bg-orange-50/30 p-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300",
            displayVariant === "compact" && "bg-transparent p-0 pt-4"
          )}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-100">
              <Star className="h-4 w-4 text-amber-400 dark:text-amber-300" />
              {recipe.rating.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                ({recipe.ratingCount})
              </span>
            </span>
            {recipe.lastCookedAt && (
              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Cooked {new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                }).format(new Date(recipe.lastCookedAt))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-100 dark:border-orange-500/70 dark:text-orange-200 dark:hover:bg-orange-500/20"
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(recipe);
              }}
            >
              View recipe
            </Button>
            <Button
              size="sm"
              className="rounded-2xl px-4"
              onClick={(event) => {
                event.stopPropagation();
                onCook?.(recipe);
              }}
            >
              Start cooking
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

