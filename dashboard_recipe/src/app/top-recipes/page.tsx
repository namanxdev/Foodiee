"use client";

import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import TopRecipes from "@/components/toprecipes/TopRecipes";

/**
 * Top Recipes Page
 * ================
 * Page for browsing and filtering top recipes
 */
export default function TopRecipesPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-slate-900">
      <Header session={session} />
      
      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-8">
          <TopRecipes />
        </main>
      </AuthGate>
    </div>
  );
}


