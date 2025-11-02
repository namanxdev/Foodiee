"use client";

import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import MainContainer from "@/components/containers/MainContainer";

/**
 * Home Page Component
 * ====================
 * Main entry point for the Foodiee application.
 * Handles authentication flow and renders appropriate content.
 */
export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-slate-900">
      <Header session={session} />
      
      <AuthGate status={status}>
        <MainContainer />
      </AuthGate>
    </div>
  );
}
