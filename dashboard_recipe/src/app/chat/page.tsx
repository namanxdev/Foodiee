/**
 * Chat Page
 * =========
 * Dedicated route for chat interface with session_id from URL
 * Supports read-only mode for shared sessions
 */

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthGate from "@/components/auth/AuthGate";
import ChatInterface from "@/components/chat/ChatInterface";
import { CinematicFooter, CinematicNav } from "@/components/layout";
import { API_CONFIG } from "@/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatHistoryEntry extends Record<string, unknown> {
  type?: string;
  message_type?: string;
  content?: string;
}

interface SessionHistoryResponse {
  chat_history?: ChatHistoryEntry[];
}

function ChatPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const urlSessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  useEffect(() => {
    if (!urlSessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }
    setSessionId(urlSessionId);
  }, [urlSessionId]);

  const loadSessionData = useCallback(
    async (sid: string) => {
      if (!session?.user?.email) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/session/${sid}/history`, {
          headers: {
            "X-User-Email": session.user.email,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as SessionHistoryResponse;
          const chatHistory = Array.isArray(data.chat_history) ? data.chat_history : [];

          const recommendationSource = chatHistory.find((message) => {
            const type = (message.type ?? message.message_type ?? "").toLowerCase();
            if (type !== "chatbot_message" && type !== "assistant_message") {
              return false;
            }
            return Boolean(
              message.content &&
                (message.content.includes("recommendations") ||
                  message.content.includes("recipe") ||
                  /^\d+\./.test(message.content))
            );
          });

          if (recommendationSource?.content) {
            setRecommendations(recommendationSource.content);
          } else {
            const firstAssistant = chatHistory.find((message) =>
              ["chatbot_message", "assistant_message"].includes(
                (message.type ?? message.message_type ?? "").toLowerCase()
              )
            );
            setRecommendations(
              firstAssistant?.content ?? "Loading your recipe recommendations..."
            );
          }
        } else if (response.status === 404) {
          setError("Session not found. It may have expired or been deleted.");
        } else {
          console.warn("Failed to load session data:", response.status);
          setRecommendations("Loading your recipe recommendations...");
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        setRecommendations("Loading your recipe recommendations...");
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.email]
  );

  useEffect(() => {
    if (!sessionId || !session?.user?.email) {
      return;
    }
    void loadSessionData(sessionId);
  }, [loadSessionData, session?.user?.email, sessionId]);

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white">
      <CinematicNav status={status} />

      <AuthGate status={status}>
        <main className="relative flex flex-1">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,90,47,0.28)_0%,_rgba(15,15,15,0.94)_45%,_rgba(5,5,5,1)_100%)]" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-32 sm:px-10 md:px-12 lg:px-16">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-4">
                <Badge className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-[#FFD07F]">
                  Step 3 · Cooking Flow
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    Your cinematic kitchen is ready.
                  </h1>
                  <p className="max-w-2xl text-base text-white/70">
                    Dive back into your session, pick up where you left off, and keep the culinary
                    story unfolding with Foodiee&apos;s AI sous chef.
                  </p>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex w-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-8 py-16 text-center text-sm text-white/70 shadow-[0_24px_60px_-30px_rgba(255,90,47,0.45)] backdrop-blur">
                <span className="loading loading-spinner loading-lg text-[#FFD07F]" />
                <p>Summoning your chat session...</p>
              </div>
            )}

            {error && !loading && (
              <div className="w-full max-w-3xl rounded-3xl border border-red-400/40 bg-red-500/10 px-8 py-10 text-center shadow-[0_24px_60px_-30px_rgba(239,68,68,0.55)] backdrop-blur">
                <h2 className="text-2xl font-semibold text-red-200">Unable to load session</h2>
                <p className="mt-3 text-sm text-red-100/80">{error}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    asChild
                    variant="gradient"
                    className="rounded-full bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] px-6 text-sm font-semibold text-[#1E1E1E]"
                  >
                    <Link href="/preferences">Start a new session</Link>
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && sessionId && (
              <ChatInterface sessionId={sessionId} initialRecommendations={recommendations} />
            )}
          </div>
        </main>
      </AuthGate>

      <div className="px-6 pb-16 pt-10 sm:px-10 md:px-12 lg:px-16">
        <CinematicFooter />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[#050505] text-white items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#FFD07F]" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
