"use client";

import Link from "next/link";
import { Layers, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PersonalizedEntry() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="glow" className="mb-3 bg-white/80">
            Your AI-powered sous chef
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tell us what you crave. We&apos;ll map the perfect recipe journey.
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-slate-600">
            Feed in your pantry, dietary goals, and timeframe. Foodiee&apos;s AI sous chef will orchestrate recipes, prep lists, and live cooking support.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="border-none bg-white/95 shadow-brand-glow ring-1 ring-orange-100/60">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-3xl bg-orange-100/80 p-4 text-orange-600">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900">
                Share your food vibe
              </CardTitle>
              <CardDescription className="text-sm font-semibold text-slate-600">
                Preferences, allergies, gear, skill level — we learn it all.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-base text-slate-600">
            Unlock a personalized discovery feed, daily meal plans, and curated grocery lists. Our AI chef tunes itself to your mood instantly.
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button asChild className="rounded-full px-6">
              <Link href="/preferences">Set preferences</Link>
            </Button>
            <Button
              variant="ghost"
              className="rounded-full px-6 text-sm font-semibold text-orange-600"
              asChild
            >
              <Link href="/preferences">Preview question flow →</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-none bg-white/95 shadow-brand-glow ring-1 ring-orange-100/60">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-3xl bg-orange-100/80 p-4 text-orange-600">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900">
                Tap into chef-crafted recipes
              </CardTitle>
              <CardDescription className="text-sm font-semibold text-slate-600">
                AI-curated recipes with step-by-step visuals and adaptive timing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-base text-slate-600">
            Explore top-rated recipes filtered by cuisine, dietary needs, or difficulty. Save collections, share with friends, and get live cooking support.
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button asChild className="rounded-full px-6">
              <Link href="/top-recipes">Browse top recipes</Link>
            </Button>
            <Button
              variant="ghost"
              className="rounded-full px-6 text-sm font-semibold text-orange-600"
              asChild
            >
              <Link href="/top-recipes">Discover trending menus →</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

