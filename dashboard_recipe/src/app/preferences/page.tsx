"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import PreferencesForm from "@/components/PreferencesForm";
import ChatInterface from "@/components/chat/ChatInterface";
import { API_CONFIG } from "@/constants";

/**
 * Preferences Page
 * ================
 * Page for users to set their preferences and get recipe recommendations
 * Supports session_id in URL for persistence
 */
export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<"preferences" | "chat">("preferences");
  const [sessionId, setSessionId] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for session_id in URL - redirect to /chat if found
  useEffect(() => {
    const urlSessionId = searchParams.get("session_id");
    if (urlSessionId) {
      // Redirect to dedicated chat route
      router.replace(`/chat?session_id=${urlSessionId}`);
    }
  }, [searchParams, router]);

  const loadSessionData = async (sid: string) => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.user?.email) {
        headers["X-User-Email"] = session.user.email;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/session/${sid}/history`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        // Extract recommendations from chat_history if available
        if (data.chat_history && data.chat_history.length > 0) {
          const botMessage = data.chat_history.find((msg: any) => msg.type === "chatbot_message");
          if (botMessage) {
            setRecommendations(botMessage.content);
            setStep("chat");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = (newSessionId: string, newRecommendations: string) => {
    // Redirect to chat page
    router.push(`/chat?session_id=${newSessionId}`);
  };

  const handleBackToPreferences = () => {
    setStep("preferences");
    // Keep session_id in URL
    if (sessionId) {
      router.push(`/preferences?session_id=${sessionId}`);
    } else {
      router.push("/preferences");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-slate-900">
      <Header session={session} />
      
      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-orange-500"></span>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading session...</p>
              </div>
            </div>
          ) : (
            <>
              {step === "preferences" && (
                <>
                  <PreferencesForm onSubmit={handlePreferencesSubmit} />
                </>
              )}

            </>
          )}
        </main>
      </AuthGate>
    </div>
  );
}


