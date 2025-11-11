"use client";

import clsx from "clsx";

type GlassCardProps = {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
};

export function GlassCard({
  title,
  eyebrow,
  children,
  className,
  highlight = false,
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-3xl transition-transform duration-500",
        "hover:-translate-y-1 hover:shadow-[0_25px_55px_-20px_rgba(255,90,47,0.55)]",
        highlight && "ring-2 ring-[#FFD07F]/60",
        className,
      )}
    >
      <div
        className={clsx(
          "absolute inset-px -z-10 rounded-[inherit] bg-[radial-gradient(circle_at_top,_rgba(255,208,127,0.25),rgba(30,30,30,0.85))]",
          highlight && "bg-[radial-gradient(circle_at_top,_rgba(255,208,127,0.45),rgba(30,30,30,0.75))]",
        )}
      />
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.3em] text-[#FFD07F]/80">
          {eyebrow}
        </p>
      )}
      {title && (
        <h3 className="mt-2 text-2xl font-semibold text-white/95">{title}</h3>
      )}
      <div className="mt-4 text-sm text-white/75">{children}</div>
    </div>
  );
}

