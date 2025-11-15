"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import { BookOpenText, BrainCircuit, Flame, Star, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const highlightItems = [
  {
    icon: <BrainCircuit className="h-4 w-4 text-orange-500" />,
    label: "Smart pairing",
    helper: "AI ingredient matches",
  },
  {
    icon: <Star className="h-4 w-4 text-amber-500" />,
    label: "Chef rated",
    helper: "Tested & loved recipes",
  },
  {
    icon: <Flame className="h-4 w-4 text-red-400" />,
    label: "Seasonal picks",
    helper: "Fresh inspo weekly",
  },
];

export function Hero() {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");

  const buildPrefillPath = () => {
    const trimmed = query.trim();
    return trimmed ? `/preferences?prefill=${encodeURIComponent(trimmed)}` : "/preferences";
  };

  const handleGenerate = () => {
    const destination = buildPrefillPath();
    if (session?.user) {
      router.push(destination);
    } else {
      signIn("google", { callbackUrl: destination });
    }
  };

  return (
    <section className="relative overflow-hidden bg-brand-gradient-soft py-20 md:py-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-red-200/30 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto flex flex-col gap-16 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-8">
          <Badge className="w-max gap-2 bg-white/80 text-orange-600 shadow-sm">
            <BrainCircuit className="h-4 w-4 text-orange-500" />
            AI-crafted recipe journeys
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Cook with confidence. <span className="text-brand-gradient">Create with AI.</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-700 dark:text-slate-300">
            Foodiee Kitchen studies your pantry, mood, and time. Generate dish ideas,
            step-by-step guidance, and plating cues—all curated for home cooks and culinary explorers.
          </p>

          <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl shadow-brand/40 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-orange-100/60 bg-white/95 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <UtensilsCrossed className="h-5 w-5 text-orange-500 dark:text-orange-300" />
                <Input
                  placeholder="What ingredients or cuisine are you craving?"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="border-none bg-transparent p-0 shadow-none text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-slate-200"
                />
              </div>
              <Button size="lg" className="w-full sm:w-auto" onClick={handleGenerate}>
                Generate recipes
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80 dark:text-slate-400">
              <span>Quick start: </span>
              <span className="rounded-full bg-orange-100/70 px-3 py-1 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200">
                3-ingredient dinners
              </span>
              <span className="rounded-full bg-orange-100/70 px-3 py-1 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200">
                High-protein bowls
              </span>
              <span className="rounded-full bg-orange-100/70 px-3 py-1 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200">
                Air-fryer snacks
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {highlightItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-surface dark:bg-orange-500/20">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    {item.helper}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative isolate w-full max-w-md"
        >
          <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-orange-200/60 blur-2xl" />
          <Card className="relative overflow-hidden border-none bg-white/90 p-0 shadow-2xl shadow-brand-glow">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-orange-50/60 bg-white/70 py-5">
              <div className="rounded-2xl bg-orange-100/80 p-3">
                <BookOpenText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Featured masterclass
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  Rustic Herb Focaccia
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                  alt="Fresh focaccia loaf with herbs"
                  width={480}
                  height={360}
                  className="h-64 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-medium">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  4.9 from culinary mentors
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-orange-100/50 bg-orange-50/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    12-step baking ritual
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Includes hydration tips & fermentation planner
                  </p>
                </div>
                <Button size="sm" variant="secondary" className="rounded-xl">
                  View walkthrough
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

