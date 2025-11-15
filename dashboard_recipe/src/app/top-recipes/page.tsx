"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthGate from "@/components/auth/AuthGate";
import TopRecipes from "@/components/toprecipes/TopRecipes";
import { CinematicFooter, CinematicNav } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "lucide-react";

/**
 * Top Recipes Page
 * ================
 * Page for browsing and filtering top recipes
 */
export default function TopRecipesPage() {
  const { status } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white">
      <CinematicNav status={status} />

      <AuthGate status={status}>
        <main className="relative flex flex-1">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.2)_0%,_rgba(15,15,15,0.92)_50%,_rgba(5,5,5,1)_100%)]" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-32 sm:px-10 md:px-12 lg:px-16">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-4">
                <Badge className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-[#FFD07F]">
                  Spotlight Collection
                </Badge>
                <div className="space-y-3">
                  <h1 className="flex items-center gap-3 text-4xl font-semibold leading-tight sm:text-5xl">
                    <Stars className="h-8 w-8 text-[#FFD07F]" />
                    Top 50 recipes
                  </h1>
                  <p className="max-w-2xl text-base text-white/70">
                    Explore the most-loved dishes pulled from Foodiee&apos;s global kitchen. Filter by cuisine,
                    dietary needs, and cooking time to find your next showstopper.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link href="/preferences">Refine Preferences</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/15"
                  >
                    <Link href="/chat">Return to Chat</Link>
                  </Button>
                </div>
              </div>
            </div>

            <TopRecipes />
          </div>
        </main>
      </AuthGate>

      <div className="px-6 pb-16 pt-10 sm:px-10 md:px-12 lg:px-16">
        <CinematicFooter />
      </div>
    </div>
  );
}
