"use client";

import type { ReactNode } from "react";

import { signIn } from "next-auth/react";
import { ChefHat, Lightbulb, Sparkles } from "lucide-react";

import LoadingSpinner from "../LoadingSpinner";
import { Button } from "@/components/ui/button";

interface AuthGateProps {
  status: "loading" | "authenticated" | "unauthenticated";
  children: React.ReactNode;
}

export default function AuthGate({ status, children }: AuthGateProps) {
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto mt-20 max-w-xl px-6">
        <div className="rounded-3xl border border-orange-100/60 bg-white/90 p-10 text-center shadow-xl shadow-brand/20 backdrop-blur">
          <div className="mb-8 flex flex-col items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-gradient text-white shadow-brand-glow">
              <ChefHat className="h-6 w-6" />
            </span>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome to Foodiee Kitchen
              </h2>
              <p className="text-base text-slate-600">
                Sign in to unlock tailored recipe paths, adaptive cooking timelines, and grocery-ready meal plans.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-left text-sm text-slate-600">
            <FeatureRow
              icon={<Sparkles className="h-4 w-4 text-orange-500" />}
              text="AI-generated dishes based on your pantry and cravings"
            />
            <FeatureRow
              icon={<Lightbulb className="h-4 w-4 text-orange-500" />}
              text="Step-by-step coaching with timers, aroma cues, and plating tips"
            />
            <FeatureRow
              icon={<ChefHat className="h-4 w-4 text-orange-500" />}
              text="Save collections, meal plans, and shareable recipe journeys"
            />
          </div>

          <Button
            size="lg"
            variant="gradient"
            className="mt-8 w-full rounded-full"
            onClick={() => signIn("google")}
          >
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function FeatureRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-orange-100/60 bg-white/80 px-4 py-3 shadow-sm">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100/70">
        {icon}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
