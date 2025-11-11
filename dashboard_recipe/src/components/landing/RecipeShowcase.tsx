"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock3, Flame, Sparkles } from "lucide-react";

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

type RecipeCard = {
  name: string;
  tags: string[];
  rating: number;
  cookTime: string;
  difficulty: "Easy" | "Intermediate" | "Advanced";
  hook: string;
  image: string;
};

const recipes: RecipeCard[] = [
  {
    name: "Charred Citrus Salmon",
    tags: ["High protein", "Sheet pan"],
    rating: 4.9,
    cookTime: "22 min",
    difficulty: "Easy",
    hook: "AI pairs pantry staples with smoky citrus butter for a weeknight showstopper.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Umami Miso Ramen",
    tags: ["Broth mastery", "Weeknight"],
    rating: 4.8,
    cookTime: "35 min",
    difficulty: "Intermediate",
    hook: "Layered broth mapped by our taste graph, complete with topping swaps for your fridge.",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Midnight Chocolate Tart",
    tags: ["Dessert studio", "Make ahead"],
    rating: 4.9,
    cookTime: "45 min",
    difficulty: "Advanced",
    hook: "Precision-timed ganache and aroma cues. Set alerts for perfect glossy slices.",
    image:
      "https://images.unsplash.com/photo-1660485038927-478e032fe2f1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1176",
  },
];

export function RecipeShowcase() {
  return (
    <section className="container mx-auto px-6 py-16 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="glow" className="mb-3 bg-white/80 dark:bg-slate-800/80">
            Spotlight recipes
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Guided recipes that teach and delight.
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Featured flows from the Foodiee Kitchen community. Follow chef-tier walkthroughs with AI cues, substitution hints, and plating notes.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-orange-200/70 bg-white/80 px-6 text-sm font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Browse the full cookbook
        </Button>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe, index) => (
          <motion.div
            key={recipe.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
          >
            <Card className="group overflow-hidden border-none bg-white/90 shadow-xl ring-1 ring-orange-100/40 transition-all hover:ring-orange-200 dark:bg-slate-900/85 dark:ring-slate-700">
              <div className="relative">
                <Image
                  src={recipe.image}
                  alt={recipe.name}
                  width={640}
                  height={420}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <Badge variant="glow" className="bg-black/50 text-white backdrop-blur">
                    <Sparkles className="h-3 w-3 text-orange-300" />
                    {recipe.rating.toFixed(1)} delight
                  </Badge>
                  <Badge className="bg-white/90 text-slate-900 shadow-md">
                    {recipe.difficulty}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  <Clock3 className="h-4 w-4 text-orange-500" />
                  {recipe.cookTime}
                </div>
              </div>

              <CardHeader className="pt-6">
                <CardTitle className="text-2xl text-slate-900 dark:text-white">
                  {recipe.name}
                </CardTitle>
                <CardDescription className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {recipe.tags.join(" • ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-orange-100/60 bg-orange-50/70 px-4 py-3 text-sm font-semibold text-orange-600 shadow-sm dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-200">
                  <Flame className="mr-2 inline h-4 w-4 text-orange-500" />
                  {recipe.hook}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Guided timers, substitution intelligence, and serving suggestions adapt as you cook. Save to collections or share with friends.
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-4">
                <Button className="rounded-full px-6">Cook this</Button>
                <Button variant="ghost" className="rounded-full px-6 text-sm font-semibold">
                  See variations
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

