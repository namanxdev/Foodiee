/**
 * History Page
 * ============
 * Shows user's session history with pagination
 * Each session can be clicked to view details
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import AuthGate from "@/components/auth/AuthGate";
import { API_CONFIG } from "@/constants";
import { FaUtensils, FaChevronLeft, FaChevronRight, FaCalendar, FaImage } from "react-icons/fa";

interface SessionItem {
  session_id: string;
  selected_recipe_name: string | null;
  created_at: string;
  last_accessed: string;
  message_count: number;
  image_count: number;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (session?.user?.email) {
      loadSessions();
    }
  }, [session, page]);

  const loadSessions = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        "X-User-Email": session.user.email,
      };

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/user/history?page=${page}&page_size=${pageSize}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to load session history");
      }

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat?session_id=${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header session={session} />

      <AuthGate status={status}>
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-2xl shadow-xl p-8 text-white mb-8">
            <div className="flex items-center gap-4 mb-3">
              <FaUtensils className="text-4xl" />
              <h1 className="text-4xl font-bold">My Recipe History</h1>
            </div>
            <p className="text-orange-100 dark:text-orange-200">
              View and revisit your previous recipe sessions
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg text-orange-500"></span>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your history...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-100 dark:bg-red-900/50 border-2 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200 p-6 rounded-xl text-center">
              <p className="font-bold text-lg mb-2">Oops! Something went wrong</p>
              <p>{error}</p>
              <button
                onClick={loadSessions}
                className="mt-4 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sessions.length === 0 && (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-xl text-center shadow-lg">
              <FaUtensils className="text-6xl text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                No history yet
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start exploring recipes to see your history here
              </p>
              <button
                onClick={() => router.push("/preferences")}
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Sessions List */}
          {!loading && !error && sessions.length > 0 && (
            <>
              <div className="space-y-4 mb-8">
                {sessions.map((sessionItem) => (
                  <div
                    key={sessionItem.session_id}
                    onClick={() => handleSessionClick(sessionItem.session_id)}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-2 border-transparent hover:border-orange-500 dark:hover:border-orange-400"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                          {sessionItem.selected_recipe_name || "Unnamed Recipe"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-orange-500" />
                            <span>{formatDate(sessionItem.last_accessed)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUtensils className="text-blue-500" />
                            <span>{sessionItem.message_count} messages</span>
                          </div>
                          {sessionItem.image_count > 0 && (
                            <div className="flex items-center gap-2">
                              <FaImage className="text-green-500" />
                              <span>{sessionItem.image_count} images</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Created
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {formatDate(sessionItem.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaChevronLeft />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <FaChevronRight />
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="text-center text-gray-600 dark:text-gray-400 mt-4">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} of{" "}
                {totalCount.toLocaleString()} sessions
              </div>
            </>
          )}
        </main>
      </AuthGate>
    </div>
  );
}

