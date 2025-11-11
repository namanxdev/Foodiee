"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type GlowingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  glow?: boolean;
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

const baseClasses =
  "relative inline-flex items-center justify-center rounded-full px-8 py-3 font-medium uppercase tracking-[0.08em] text-[#1E1E1E] shadow-[0_20px_45px_-18px_rgba(255,90,47,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5A2F]/50 bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F]";

export function GlowingButton({
  label,
  glow = true,
  href,
  children,
  className,
  onClick,
  type = "button",
  disabled = false,
  ...rest
}: GlowingButtonProps) {
  const { ["aria-label"]: ariaLabel, ...buttonRest } = rest;
  const content = (
    <motion.span
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.32, 1] }}
      className={clsx(
        baseClasses,
        glow && "after:absolute after:inset-0 after:-z-10 after:rounded-full after:bg-[#FF5A2F] after:opacity-60 after:blur-[24px]",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative flex items-center gap-2 text-sm md:text-base">
        {children ?? label}
        <span aria-hidden className="text-lg">
          →
        </span>
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={clsx("inline-flex", disabled && "pointer-events-none")}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex"
      aria-label={ariaLabel}
      {...buttonRest}
    >
      {content}
    </button>
  );
}

