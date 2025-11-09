"use client";

import { useSession } from "next-auth/react";

import AuthGate from "@/components/auth/AuthGate";
import { AppFooter } from "@/components/landing/AppFooter";
import { CategorySpotlight } from "@/components/landing/CategorySpotlight";
import { Hero } from "@/components/landing/Hero";
import { PersonalizedEntry } from "@/components/landing/PersonalizedEntry";
import { PromoSpotlight } from "@/components/landing/PromoSpotlight";
import { RecipeShowcase } from "@/components/landing/RecipeShowcase";
import { TestimonialsSection } from "@/components/landing/Testimonials";
import Header from "@/components/layout/Header";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header session={session} />

      <main className="flex flex-col gap-0">
        <Hero />
        <CategorySpotlight />
        <RecipeShowcase />
        <PromoSpotlight />
        <TestimonialsSection />
        <AuthGate status={status}>
          <PersonalizedEntry />
        </AuthGate>
      </main>

      <AppFooter />
    </div>
  );
}
