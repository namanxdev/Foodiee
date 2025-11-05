/**
 * Chat Page
 * =========
 * Dedicated route for chat interface with session_id from URL
 * Supports read-only mode for shared sessions
 */

"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import ChatInterface from "@/components/chat/ChatInterface";
import { API_CONFIG } from "@/constants";
import { FaArrowLeft } from "react-icons/fa";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get session_id from URL
  useEffect(() => {
    const urlSessionId = searchParams.get("session_id");
    if (urlSessionId) {
      setSessionId(urlSessionId);
      loadSessionData(urlSessionId);
    } else {
      setError("No session ID provided");
      setLoading(false);
    }
  }, [searchParams]);

  const loadSessionData = async (sid: string) => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        "X-User-Email": session.user.email,
      };

      // Get session history to extract recommendations
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/session/${sid}/history`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Extract recommendations from chat_history
        if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          // Look for chatbot message with recommendations
          let botMessage = data.chat_history.find(
            (msg: any) => (msg.type === "chatbot_message" || msg.message_type === "chatbot_message") && 
                          msg.content && 
                          (msg.content.includes("recommendations") || 
                           msg.content.includes("recipe") ||
                           msg.content.match(/^\d+\./))  // Starts with number (like "1. Recipe Name")
          );
          
          if (!botMessage) {
            // Fallback: use first chatbot message
            botMessage = data.chat_history.find(
              (msg: any) => msg.type === "chatbot_message" || msg.message_type === "chatbot_message"
            );
          }
          
          if (botMessage && botMessage.content) {
            setRecommendations(botMessage.content);
          } else {
            setRecommendations("Loading your recipe recommendations...");
          }
        } else {
          setRecommendations("Loading your recipe recommendations...");
        }
      } else if (response.status === 404) {
        setError("Session not found. It may have expired or been deleted.");
      } else {
        // Don't show error for other status codes - might be temporary
        console.warn("Failed to load session data:", response.status);
        setRecommendations("Loading your recipe recommendations...");
      }
    } catch (err: any) {
      console.error("Failed to load session:", err);
      // Don't show error on network failure - allow chat to load with empty recommendations
      setRecommendations("Loading your recipe recommendations...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header session={session} />

      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/preferences")}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <FaArrowLeft />
            <span>Back to Preferences</span>
          </button>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-orange-500"></span>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading chat session...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-100 dark:bg-red-900/50 border-2 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200 p-6 rounded-xl text-center max-w-2xl mx-auto">
              <p className="font-bold text-lg mb-2">Unable to Load Session</p>
              <p className="mb-4">{error}</p>
              <button
                onClick={() => router.push("/preferences")}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Preferences
              </button>
            </div>
          )}

          {/* Chat Interface */}
          {!loading && !error && sessionId && (
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

