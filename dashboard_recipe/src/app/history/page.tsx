/**
 * History Page
 * ============
 * Shows user's session history with pagination
 * Each session can be clicked to view details
 */

"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  History as HistoryIcon,
  ImageIcon,
  LayoutGrid,
  LayoutList,
  MessageCircle,
  Search,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import AuthGate from "@/components/auth/AuthGate";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_CONFIG } from "@/constants";

type ViewMode = "list" | "grid";

interface SessionItem {
  session_id: string;
  selected_recipe_name: string | null;
  created_at: string;
  last_accessed: string;
  message_count: number;
  image_count: number;
}

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
  { unit: "second", ms: 1000 },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "unknown time";

  const diff = date.getTime() - Date.now();
  for (const { unit, ms } of TIME_UNITS) {
    if (Math.abs(diff) >= ms || unit === "second") {
      const value = diff / ms;
      return RELATIVE_TIME_FORMAT.format(Math.round(value), unit);
    }
  }
  return "just now";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (session?.user?.email) {
      void loadSessions();
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (page !== 1) {
      setPage(1);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const query = searchTerm.trim().toLowerCase();
    return sessions.filter((sessionItem) =>
      (sessionItem.selected_recipe_name || "Unnamed Recipe").toLowerCase().includes(query)
    );
  }, [sessions, searchTerm]);

  const hasFilters = searchTerm.trim().length > 0;
  const displayedSessions = filteredSessions;

  const totalMessagesOnPage = useMemo(
    () => sessions.reduce((sum, item) => sum + (item.message_count || 0), 0),
    [sessions]
  );
  const totalImagesOnPage = useMemo(
    () => sessions.reduce((sum, item) => sum + (item.image_count || 0), 0),
    [sessions]
  );
  const uniqueRecipesOnPage = useMemo(
    () =>
      new Set(
        sessions.map((sessionItem) => sessionItem.selected_recipe_name || "Unnamed Recipe")
      ).size,
    [sessions]
  );

  const latestSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return [...sessions].sort(
      (a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
    )[0];
  }, [sessions]);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex =
    totalCount === 0 ? 0 : Math.min((page - 1) * pageSize + sessions.length, totalCount);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,231,0.9),_rgba(255,232,205,0.55)_45%,_rgba(255,220,193,0.35)_70%,_transparent_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(15,23,42,0.85)_60%,_rgba(15,23,42,0.7)_100%)]">
      <Header session={session} />

      <AuthGate status={status}>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-orange-500 via-orange-400 to-rose-500 text-white shadow-[0_35px_120px_-25px_rgba(255,99,71,0.45)] dark:border-white/10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_rgba(255,255,255,0)_60%)]" />
            <div className="relative flex flex-col gap-8 px-8 py-10 sm:px-10 lg:px-12">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-3xl bg-white/20 p-3 backdrop-blur-md">
                    <HistoryIcon className="h-10 w-10" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                      Cooked History
                    </h1>
                    <p className="mt-2 max-w-xl text-base text-orange-50/90 sm:text-lg">
                      Revisit every culinary journey you have taken with insights across your
                      conversations, images, and recipes.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="glow"
                  className="self-start bg-white/20 text-sm font-semibold uppercase tracking-wider text-white shadow-brand/60 backdrop-blur-md"
                >
                  <Sparkles className="h-4 w-4" />
                  {totalCount.toLocaleString()} sessions cooked
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Sparkles className="h-5 w-5" />}
                  label="Total Sessions"
                  value={totalCount.toLocaleString()}
                  caption="Across your entire history"
                />
                <StatCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Messages This Page"
                  value={totalMessagesOnPage.toLocaleString()}
                  caption="Conversation highlights right here"
                />
                <StatCard
                  icon={<ImageIcon className="h-5 w-5" />}
                  label="Images Generated"
                  value={totalImagesOnPage.toLocaleString()}
                  caption="Visual inspiration saved"
                />
                <StatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Latest Session"
                  value={latestSession ? formatRelativeTime(latestSession.last_accessed) : "—"}
                  caption={
                    latestSession ? formatDate(latestSession.last_accessed) : "No sessions yet"
                  }
                />
              </div>
            </div>
          </section>

          <Card className="border-border/60 bg-white/95 shadow-xl shadow-brand/20 backdrop-blur-sm dark:border-border/40 dark:bg-card/90">
            <CardHeader className="gap-6 pb-0">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-brand-surface/80 p-3 text-primary shadow-inner">
                    <UtensilsCrossed className="h-6 w-6" strokeWidth={1.6} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold">Session Library</CardTitle>
                    <CardDescription className="max-w-xl text-base">
                      Browse, filter, and reopen any cooking session. Your latest journeys appear
                      first.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "gradient" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                    List view
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "gradient" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Grid view
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by recipe name or session title..."
                  className="h-12 rounded-2xl border border-border bg-white/95 pl-11 pr-4 text-base shadow-inner shadow-brand/10 dark:bg-card/80"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
              {loading && (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 md:grid-cols-2"
                      : "flex flex-col gap-6"
                  }
                >
                  {Array.from({ length: viewMode === "grid" ? 4 : 3 }).map((_, index) => (
                    <div
                      key={`history-skeleton-${index}`}
                      className="animate-pulse rounded-3xl border border-border/60 bg-muted/40 p-6 shadow-inner shadow-brand/10 dark:bg-muted/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/60 dark:bg-white/10" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-3/5 rounded-full bg-white/60 dark:bg-white/20" />
                          <div className="h-3 w-1/2 rounded-full bg-white/40 dark:bg-white/10" />
                        </div>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="h-3 w-full rounded-full bg-white/30 dark:bg-white/10" />
                        <div className="h-3 w-full rounded-full bg-white/30 dark:bg-white/10" />
                        <div className="h-3 w-3/4 rounded-full bg-white/20 dark:bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && !loading && (
                <div className="rounded-3xl border border-destructive/40 bg-destructive/10 px-8 py-10 text-center shadow-lg shadow-destructive/20 backdrop-blur-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20 text-destructive shadow-inner shadow-destructive/30">
                    <HistoryIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-destructive">We hit a snag</h3>
                  <p className="mt-2 text-base text-destructive/80">
                    {error || "Something went wrong while fetching your history. Please retry."}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      className="gap-2"
                      onClick={() => void loadSessions()}
                    >
                      Refresh history
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !error && displayedSessions.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/40 px-8 py-16 text-center shadow-inner shadow-brand/10 dark:border-border/50 dark:bg-muted/20">
                  <HistoryIcon className="h-14 w-14 text-muted-foreground" strokeWidth={1.5} />
                  <h3 className="mt-6 text-2xl font-semibold text-foreground">
                    {hasFilters ? "No sessions match your search" : "Your cooking journey awaits"}
                  </h3>
                  <p className="mt-3 max-w-xl text-base text-muted-foreground">
                    {hasFilters
                      ? "Try adjusting your search keywords or clear the filters to see all sessions again."
                      : "Start exploring recipes with the assistant to build a history of personalized cooking sessions."}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {hasFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchChange("")}
                      >
                        Clear search
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      className="gap-2"
                      onClick={() => router.push("/preferences")}
                    >
                      Start a new session
                      <UtensilsCrossed className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !error && displayedSessions.length > 0 && (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 md:grid-cols-2"
                      : "flex flex-col gap-6"
                  }
                >
                  {displayedSessions.map((sessionItem) => (
                    <SessionCard
                      key={sessionItem.session_id}
                      sessionItem={sessionItem}
                      onOpen={handleSessionClick}
                      searchTerm={searchTerm}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">Library status</span>
                  <span aria-hidden="true">•</span>
                  {hasFilters ? (
                    <span>
                      {displayedSessions.length} match
                      {displayedSessions.length === 1 ? "" : "es"} for &ldquo;{searchTerm}&rdquo;
                      on this page.
                    </span>
                  ) : totalCount > 0 ? (
                    <span>
                      Showing {startIndex.toLocaleString()} – {endIndex.toLocaleString()} of{" "}
                      {totalCount.toLocaleString()} sessions.
                    </span>
                  ) : (
                    <span>There are no recorded sessions yet.</span>
                  )}
                  <span aria-hidden="true" className="hidden sm:inline">
                    •
                  </span>
                  <span className="hidden sm:inline">
                    {uniqueRecipesOnPage} unique recipes in this view.
                  </span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={page === totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </AuthGate>
    </div>
  );
}

interface SessionCardProps {
  sessionItem: SessionItem;
  searchTerm: string;
  onOpen: (sessionId: string) => void;
}

function SessionCard({ sessionItem, onOpen, searchTerm }: SessionCardProps) {
  const title = sessionItem.selected_recipe_name || "Unnamed Recipe";

  const renderHighlighted = (text: string): ReactNode => {
    if (!searchTerm.trim()) return text;
    const safeQuery = escapeRegExp(searchTerm.trim());
    const regex = new RegExp(`(${safeQuery})`, "ig");
    return text.split(regex).map((segment, index) => {
      if (!segment) return null;
      const match = segment.toLowerCase() === searchTerm.trim().toLowerCase();
      return match ? (
        <mark
          key={`${segment}-${index}`}
          className="rounded-full bg-orange-200/80 px-2 py-0.5 text-sm font-semibold text-orange-900 shadow-sm"
        >
          {segment}
        </mark>
      ) : (
        <span key={`${segment}-${index}`}>{segment}</span>
      );
    });
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(sessionItem.session_id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(sessionItem.session_id);
        }
      }}
      className="group relative overflow-hidden border-border/60 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-2xl hover:shadow-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-50 dark:bg-card/90"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/45 via-white/10 to-transparent dark:from-orange-500/15 dark:via-transparent" />
      </div>
      <CardHeader className="relative flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand-surface/90 p-3 text-primary shadow-inner shadow-brand/30">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              {renderHighlighted(title)}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Cooked {formatRelativeTime(sessionItem.last_accessed)}
              <span aria-hidden="true">•</span>
              <CalendarDays className="h-4 w-4" />
              {formatDate(sessionItem.last_accessed)}
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-2 text-sm text-foreground hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(sessionItem.session_id);
          }}
        >
          Continue session
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="relative grid gap-6 sm:grid-cols-2">
        <dl className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <div>
              <dt className="font-medium text-foreground">Created</dt>
              <dd>{formatDate(sessionItem.created_at)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <HistoryIcon className="h-4 w-4 text-primary" />
            <div>
              <dt className="font-medium text-foreground">Last accessed</dt>
              <dd>{formatDate(sessionItem.last_accessed)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <dt className="font-medium text-foreground">Session ID</dt>
              <dd className="font-mono text-xs text-muted-foreground/80">
                {sessionItem.session_id}
              </dd>
            </div>
          </div>
        </dl>
        <div className="flex flex-wrap items-start gap-3">
          <Badge variant="glow" size="sm" className="gap-2 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            {sessionItem.message_count} messages
          </Badge>
          {sessionItem.image_count > 0 && (
            <Badge variant="glow" size="sm" className="gap-2 text-xs">
              <ImageIcon className="h-3.5 w-3.5" />
              {sessionItem.image_count} images
            </Badge>
          )}
          <Badge variant="outline" size="sm" className="gap-2 text-xs">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {formatRelativeTime(sessionItem.last_accessed)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
}

function StatCard({ icon, label, value, caption }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/35 bg-white/15 p-6 shadow-lg shadow-black/10 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/10">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 text-white shadow-inner shadow-black/20">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-white/80">{caption}</p>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}

