"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { RecipeStep } from "@/types/library";
import {
  FancyFadeIn,
  FancyPresence,
  FancySlideIn,
} from "@/components/animations/FancyComponents";
import { GlowingButton } from "@/components/ui/GlowingButton";

type StepReaderProps = {
  steps: RecipeStep[];
  recipeTitle: string;
};

export function StepReader({ steps, recipeTitle }: StepReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const currentStep = steps[currentIndex];
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleRegenerate = () => {
    setRegenerating(true);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!regenerating) return;
    const timeout = window.setTimeout(() => setRegenerating(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [regenerating]);

  const timeline = useMemo(
    () =>
      steps.map((step, index) => ({
        id: step.id,
        title: step.title,
        done: index < currentIndex,
        active: index === currentIndex,
        position: index + 1,
      })),
    [steps, currentIndex],
  );

  return (
    <section className="space-y-10">
      <FancyFadeIn className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-[#FFD07F]/80">
              Step {currentIndex + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{currentStep.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-[#FFD07F]/50 hover:text-white disabled:opacity-30"
              disabled={currentIndex === 0}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-[#FFD07F]/50 hover:text-white disabled:opacity-30"
              disabled={currentIndex === steps.length - 1}
            >
              Next →
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              className="relative overflow-hidden rounded-full border border-[#FFD07F]/40 bg-[#FFD07F]/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#FFD07F] shadow-[0_0_30px_rgba(255,208,127,0.35)] transition hover:border-[#FFD07F]/60 hover:text-white"
            >
              {regenerating ? "Regenerating..." : "Regenerate Step"}
              {regenerating && (
                <motion.span
                  className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,208,127,0.4),transparent)]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop" }}
                />
              )}
            </button>
          </div>
        </div>
        <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F]"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.6 }}
          />
        </div>
      </FancyFadeIn>

      <FancyPresence show>
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2.25rem] border border-white/10 bg-white/10 p-8 backdrop-blur-3xl"
        >
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6 text-white">
              <p className="text-sm uppercase tracking-[0.45em] text-white/55">
                {recipeTitle}
              </p>
              <p className="text-lg leading-7 text-white/85">{currentStep.instruction}</p>
              {currentStep.tip && (
                <div className="rounded-3xl border border-[#FFD07F]/30 bg-[#FFD07F]/10 p-6 text-sm text-[#FFD07F]">
                  <p className="uppercase tracking-[0.45em] text-xs text-[#FFD07F]/80">
                    Chef tip
                  </p>
                  <p className="mt-3 text-white">{currentStep.tip}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-8">
              {currentStep.durationMinutes && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.45em] text-white/60">
                    Time on this beat
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-[#FFD07F]">
                    {currentStep.durationMinutes} min
                  </p>
                </div>
              )}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-xs uppercase tracking-[0.4em] text-white/60">
                Swipe on mobile • Arrow keys on desktop
              </div>
              <GlowingButton href="/images" label="View AI Visual" />
            </div>
          </div>
        </motion.div>
      </FancyPresence>

      <FancyFadeIn className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Step timeline
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {timeline.map((item) => (
            <FancySlideIn
              key={item.id}
              direction="left"
              className={`rounded-2xl border border-white/10 px-4 py-3 text-sm transition ${
                item.active
                  ? "bg-gradient-to-r from-[#FF5A2F]/25 via-[#FF7A45]/15 to-[#FFD07F]/15 text-white"
                  : item.done
                    ? "bg-white/10 text-white/75"
                    : "bg-black/40 text-white/50"
              }`}
            >
              <span className="font-semibold text-white/85">
                Step {item.position}
              </span>
              <p className="text-sm">{item.title}</p>
            </FancySlideIn>
          ))}
        </div>
      </FancyFadeIn>
    </section>
  );
}

