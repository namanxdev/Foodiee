"use client";

import Link from "next/link";
import { Apple, Instagram, Linkedin, Twitter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  {
    title: "Discover",
    links: ["Top Rated", "New on Foodiee", "Midnight Kitchens", "Cloud Kitchens", "Vegan Club"],
  },
  {
    title: "Support",
    links: ["Help Center", "Live Order Tracking", "Partner with Us", "Affiliate Program", "Gift Cards"],
  },
  {
    title: "Company",
    links: ["About Foodiee", "Careers", "Press", "Privacy Policy", "Terms & Conditions"],
  },
];

export function AppFooter() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            <Badge variant="glow" className="bg-orange-400/20 text-orange-200">
              Foodiee
            </Badge>
            <p className="text-lg text-slate-300">
              Crafted for food lovers who crave design, speed, and a little midnight magic. We ship cravings city-wide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="gradient"
                className="rounded-full px-6 text-sm"
              >
                Download App
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/5 px-6 text-sm text-slate-100 hover:bg-white/10"
              >
                <Apple className="mr-2 h-4 w-4" />
                App Store
              </Button>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link href="/" className="transition-colors hover:text-orange-200">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-12 border-orange-200/10" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Foodiee. Powered by taste, crafted in UI heaven.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="transition-colors hover:text-orange-200">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="/" className="transition-colors hover:text-orange-200">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="/" className="transition-colors hover:text-orange-200">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

