"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RecipeCardSkeletonProps {
  variant?: "compact" | "expanded";
  className?: string;
}

export function RecipeCardSkeleton({
  variant = "expanded",
}: RecipeCardSkeletonProps) {
  const sharedImageClasses =
    variant === "compact"
      ? "h-40 w-40 flex-shrink-0 rounded-2xl"
      : "h-48 w-full rounded-3xl";

  return (
    <div
      className={cn(
        "flex h-full animate-in fade-in-50 rounded-3xl border border-orange-50 bg-white/80 p-0 shadow-brand/20",
        variant === "compact" ? "flex-row gap-4 p-4" : "flex-col"
      )}
    >
      <Skeleton className={sharedImageClasses} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3 rounded-full" />
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-orange-100/60 pt-4">
          <Skeleton className="h-4 w-28 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}




