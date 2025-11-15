"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-gradient text-primary-foreground shadow-brand",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-dashed border-border text-muted-foreground",
        glow:
          "border border-orange-200/40 bg-white/90 text-foreground shadow-brand",
      },
      size: {
        default: "gap-2",
        sm: "gap-1 px-2.5 py-1 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };




