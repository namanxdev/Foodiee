"use client";

import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import PreferencesForm from "@/components/PreferencesForm";
import ChatInterface from "@/components/chat/ChatInterface";
import { useState } from "react";

/**
 * Preferences Page
 * ================
 * Page for users to set their preferences and get recipe recommendations
 */
export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<"preferences" | "chat">("preferences");
  const [sessionId, setSessionId] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const handlePreferencesSubmit = (newSessionId: string, newRecommendations: string) => {
    setSessionId(newSessionId);
    setRecommendations(newRecommendations);
    setStep("chat");
  };

  const handleBackToPreferences = () => {
    setStep("preferences");
    setSessionId("");
    setRecommendations("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-slate-900">
      <Header session={session} />
      
      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-8">
          {step === "preferences" && (
            <>
              <PreferencesForm onSubmit={handlePreferencesSubmit} />
            </>
          )}

          {step === "chat" && sessionId && (
            <ChatInterface 
              sessionId={sessionId} 
              initialRecommendations={recommendations}
            />
          )}
        </main>
      </AuthGate>
    </div>
  );
}


