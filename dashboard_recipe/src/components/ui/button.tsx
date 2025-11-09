"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-primary-foreground shadow-brand-glow hover:brightness-105 focus-visible:ring-orange-200 focus-visible:ring-offset-orange-50",
        gradient:
          "bg-brand-gradient text-primary-foreground shadow-brand-glow hover:shadow-brand focus-visible:ring-orange-200 focus-visible:ring-offset-orange-50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 focus-visible:ring-orange-200 focus-visible:ring-offset-orange-50",
        outline:
          "border border-border/80 bg-white text-foreground hover:bg-white/70 hover:border-border focus-visible:ring-orange-200 focus-visible:ring-offset-orange-50",
        ghost:
          "text-foreground hover:bg-brand-surface focus-visible:ring-orange-200 focus-visible:ring-offset-orange-50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        sm: "h-10 px-4 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

