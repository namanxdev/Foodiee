"use client";

import type { ReactNode } from "react";

import {
  Apple,
  Bean,
  ChefHat,
  Cookie,
  Croissant,
  Flame,
  Leaf,
  Salad,
  Sandwich,
  Soup,
  Wheat,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type Category = {
  label: string;
  icon: ReactNode;
  tone: string;
};

const categoryGroups: Record<string, Category[]> = {
  foundations: [
    { label: "Weeknight Winners", icon: <Sandwich className="h-4 w-4" />, tone: "bg-orange-100 text-orange-600" },
    { label: "Under 30 Minutes", icon: <Flame className="h-4 w-4" />, tone: "bg-amber-100 text-amber-600" },
    { label: "Pantry Staples", icon: <Bean className="h-4 w-4" />, tone: "bg-lime-100 text-lime-600" },
    { label: "Meal Prep Bowls", icon: <Salad className="h-4 w-4" />, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Comfort Classics", icon: <Soup className="h-4 w-4" />, tone: "bg-red-100 text-red-600" },
    { label: "Breakfast Boost", icon: <Croissant className="h-4 w-4" />, tone: "bg-sky-100 text-sky-600" },
  ],
  mastery: [
    { label: "Beginner Friendly", icon: <ChefHat className="h-4 w-4" />, tone: "bg-blue-100 text-blue-600" },
    { label: "One-Pot Magic", icon: <Soup className="h-4 w-4" />, tone: "bg-orange-100 text-orange-600" },
    { label: "Plant-Powered", icon: <Leaf className="h-4 w-4" />, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Family Style", icon: <Apple className="h-4 w-4" />, tone: "bg-amber-100 text-amber-600" },
    { label: "Make-Ahead Sauces", icon: <Wheat className="h-4 w-4" />, tone: "bg-purple-100 text-purple-600" },
  ],
  indulgence: [
    { label: "Bake Therapy", icon: <Cookie className="h-4 w-4" />, tone: "bg-rose-100 text-rose-600" },
    { label: "Artisan Breads", icon: <Wheat className="h-4 w-4" />, tone: "bg-yellow-100 text-yellow-600" },
    { label: "Slow Sundays", icon: <Flame className="h-4 w-4" />, tone: "bg-orange-100 text-orange-600" },
    { label: "Celebration Cakes", icon: <Croissant className="h-4 w-4" />, tone: "bg-pink-100 text-pink-600" },
    { label: "Decadent Desserts", icon: <Cookie className="h-4 w-4" />, tone: "bg-purple-100 text-purple-600" },
  ],
};

export function CategorySpotlight() {
  return (
    <section className="container mx-auto px-6 py-16 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="glow" className="mb-3 bg-white/80 dark:bg-slate-800/80">
            Curated for your cravings
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Pick a vibe. We&apos;ll build the menu.
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Swipe through cooking paths that match your schedule, skills, and cravings. Each collection adapts instantly based on what&apos;s in your pantry.
          </p>
        </div>
      </div>

      <Tabs defaultValue="foundations" className="mt-8">
        <TabsList>
          <TabsTrigger value="foundations">Quick wins</TabsTrigger>
          <TabsTrigger value="mastery">Skill builders</TabsTrigger>
          <TabsTrigger value="indulgence">Slow cooking</TabsTrigger>
        </TabsList>

        {Object.entries(categoryGroups).map(([key, categories]) => (
          <TabsContent key={key} value={key}>
          <ScrollArea>
            <div className="flex gap-3 overflow-hidden py-1">
                {categories.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                  className="group flex items-center gap-3 rounded-full border border-orange-100/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-brand-gradient hover:text-primary-foreground hover:shadow-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${category.tone} group-hover:bg-white/20 group-hover:text-white dark:group-hover:bg-white/20 dark:group-hover:text-white`}
                    >
                      {category.icon}
                    </span>
                    {category.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

