"use client";

import { Brain, LineChart, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PromoSpotlight() {
  return (
    <section className="container mx-auto px-6 py-16">
      <Card className="overflow-hidden border-none bg-brand-gradient text-primary-foreground shadow-brand-glow">
        <CardContent className="grid gap-10 p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-5">
            <Badge variant="glow" className="bg-white/25 text-white">
              New in Foodiee Pro
            </Badge>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Unlock guided meal plans tailored to your rhythm.
            </h2>
            <p className="text-lg text-orange-50/90">
              Build smart meal plans with nutrition macros, grocery auto-lists, and adaptive cook-alongs. Foodiee Pro keeps inspiration flowing without the mental load.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-orange-50">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
                <Brain className="h-4 w-4" />
                Predictive recipe coaching
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
                <LineChart className="h-4 w-4" />
                Nutrition tracking dashboards
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
                <NotebookPen className="h-4 w-4" />
                Auto-generated grocery lists
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="gradient" className="rounded-full px-8">
                Start 14-day trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/60 bg-transparent text-white hover:bg-white/20"
              >
                Explore plan templates
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex h-72 w-72 items-center justify-center rounded-[3rem] border border-white/40 bg-white/15 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="flex flex-col items-center gap-6 text-center text-white">
                <span className="text-sm uppercase tracking-[0.3rem] text-orange-100/80">
                  Personalized cadence
                </span>
                <div className="text-6xl font-black tracking-tight">₹249</div>
                <p className="max-w-[12rem] text-sm text-orange-50/90">
                  Flexible subscription built for makers and meal preppers. Pause anytime, keep your saved journeys forever.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

