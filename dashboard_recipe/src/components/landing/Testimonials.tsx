"use client";

import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Testimonial = {
  name: string;
  title: string;
  quote: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Riya Kapoor",
    title: "Food creator @EatsWithRiya",
    quote:
      "Foodiee Kitchen became my sous chef. Ingredient swaps, plating cues, and auto-generated grocery lists mean I can film without second-guessing.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Aman Farooq",
    title: "Weekend baker & product lead",
    quote:
      "The recipe timelines feel like a digital mentor. Timers adapt when I pause, and the aroma cues keep my bakes on point.",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Saanvi Pillai",
    title: "Nutrition coach & meal prepper",
    quote:
      "Clients love the personalized plans. Foodiee tracks macros, nudges variety, and turns pantry leftovers into inspired meals.",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb272000000?auto=format&fit=crop&w=300&q=80",
  },
];

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="text-center">
        <Badge variant="glow" className="mb-4 bg-white/80">
          Word on the street
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Loved by creators, home cooks, and nutrition nerds.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Foodiee Kitchen brings Michelin-style assistance to the everyday kitchen. Hear how our AI coach fuels exploration and confidence.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
          >
            <Card className="h-full border-orange-100/60 bg-white/90 p-6 shadow-lg shadow-brand/30 backdrop-blur">
              <CardContent className="flex h-full flex-col gap-6 p-0">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-orange-100">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-base leading-7 text-slate-700">{testimonial.quote}</p>
                <div className="mt-auto text-sm font-semibold text-orange-500">
                  ★ 4.9 delight score · 120k+ guided sessions
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

