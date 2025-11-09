"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-orange-100/60 via-orange-50 to-orange-100/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

