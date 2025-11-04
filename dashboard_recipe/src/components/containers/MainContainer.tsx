"use client";

import { useState } from "react";
import PreferencesForm from "../PreferencesForm";
import ChatInterface from "../chat/ChatInterface";
import TopRecipes from "../toprecipes/TopRecipes";

type AppStep = "preferences" | "chat";

export default function MainContainer() {
  const [step, setStep] = useState<AppStep>("preferences");
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
    <main className="container mx-auto px-4 py-8">
      {step === "preferences" && (
        <>
          <PreferencesForm onSubmit={handlePreferencesSubmit} />
          
          {/* TOP RECIPES SECTION */}
          <div className="mt-12">
            <TopRecipes />
          </div>
        </>
      )}

      {step === "chat" && sessionId && (
        <ChatInterface 
          sessionId={sessionId} 
          initialRecommendations={recommendations}
        />
      )}
    </main>
  );
}
