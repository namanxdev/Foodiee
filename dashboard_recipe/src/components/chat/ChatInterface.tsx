"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  FastForward,
  ImageIcon,
  Lock,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import ImageGeneratingAnimation from "@/components/ImageGeneratingAnimation";
import LoadingSpinner from "@/components/LoadingSpinner";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_CONFIG } from "@/constants";
import {
  generateStepImage,
  getNextStep,
  getRecipeDetails,
  skipSteps,
} from "@/services/cookingStepsApi";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  initialRecommendations: string;
}

export default function ChatInterface({
  sessionId,
  initialRecommendations,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [imageLimitReached, setImageLimitReached] = useState(false);
  const [creditsPopup, setCreditsPopup] = useState<{
    show: boolean;
    remaining: number;
    max: number;
    allowed: boolean;
  } | null>(null);
  const [recipeNames, setRecipeNames] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef(false);

  const parseRecipeNames = (text: string): string[] => {
    if (!text) return ["Recipe 1", "Recipe 2", "Recipe 3"];

    const recipes: string[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^\*?\*?\s*step\b/i.test(trimmed) || trimmed.toLowerCase().startsWith("step ")) {
        continue;
      }

      const boldMatch = trimmed.match(/\*\*([^*]+?)\*\*/);
      if (boldMatch?.[1]) {
        const rawName = boldMatch[1].trim();
        const recipeName = rawName.replace(/\s*\([^)]*\)\s*$/, "").trim();
        if (
          recipeName &&
          recipeName.length > 3 &&
          recipeName.length < 100 &&
          !recipes.includes(recipeName) &&
          !recipeName.toLowerCase().startsWith("recipe ")
        ) {
          recipes.push(recipeName);
          continue;
        }
      }

      const patterns = [
        /^\*?\*?\s*(\d+)\.\s*\*?\*?\s*(.+?)(?:\s*[-–—(]|$)/i,
        /^Recipe\s+(\d+)[:.]?\s*(.+?)(?:\s*[-–—(]|$)/i,
        /^\*\*(\d+)\.\s*(.+?)\*\*/i,
        /^(\d+)\.\s*(.+?)(?:\s*\(|$)/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match?.[2]) {
          const recipeName = match[2]
            .trim()
            .replace(/\*\*/g, "")
            .replace(/^[-–—]\s*/, "")
            .replace(/\s*\(.*?\)\s*$/, "")
            .replace(/\s*[-–—].*$/, "")
            .trim();

          if (
            recipeName &&
            recipeName.length > 3 &&
            recipeName.length < 100 &&
            !recipes.includes(recipeName) &&
            !recipeName.toLowerCase().startsWith("recipe ") &&
            !/^\d+$/.test(recipeName)
          ) {
            recipes.push(recipeName);
            break;
          }
        }
      }
    }

    if (recipes.length > 0) {
      return recipes.slice(0, 3);
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.length > 10 &&
        trimmed.length < 80 &&
        !/^\*?\*?\s*step\b/i.test(trimmed) &&
        !trimmed.toLowerCase().startsWith("step ")
      ) {
        const boldMatch = trimmed.match(/\*\*([^*]+?)\*\*/);
        if (boldMatch?.[1]) {
          const cleaned = boldMatch[1]
            .trim()
            .replace(/\s*\([^)]*\)\s*$/, "")
            .trim();
          if (cleaned.length > 5 && !recipes.includes(cleaned)) {
            recipes.push(cleaned);
            if (recipes.length >= 3) break;
          }
        } else {
          const cleaned = trimmed
            .replace(/^\d+\.\s*/, "")
            .replace(/\*\*/g, "")
            .trim();
          if (cleaned.length > 5 && !recipes.includes(cleaned)) {
            recipes.push(cleaned);
            if (recipes.length >= 3) break;
          }
        }
      }
    }

    return recipes.length > 0 ? recipes.slice(0, 3) : ["Recipe 1", "Recipe 2", "Recipe 3"];
  };

  const loadChatHistory = useCallback(async () => {
    if (!session?.user?.email || messagesLoaded || historyLoadedRef.current) return;

    historyLoadedRef.current = true;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/history/${sessionId}`, {
        headers: {
          "X-User-Email": session.user.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const chatHistory = Array.isArray(data.chat_history) ? data.chat_history : [];
        const imageHistory = Array.isArray(data.image_urls) ? data.image_urls : [];

        type TimelineEntry = {
          timestamp: number;
          order: number;
          message: Message;
        };

        const timeline: TimelineEntry[] = [];
        let orderCounter = 0;

        const parseTimestamp = (value?: string) => {
          if (!value) return Number.MAX_SAFE_INTEGER;
          const parsed = Date.parse(value);
          return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
        };

        const addTimelineMessage = (message: Message, timestamp?: string) => {
          timeline.push({
            timestamp: parseTimestamp(timestamp),
            order: orderCounter++,
            message,
          });
        };

        for (const item of chatHistory) {
          if (!item || typeof item !== "object") continue;
          const type = (item.type || item.message_type || "").toLowerCase();
          const timestamp = item.timestamp || item.created_at || item.updated_at;

          if (type === "user_message") {
            addTimelineMessage(
              {
                role: "user",
                content: item.content || "",
              },
              timestamp
            );
          } else if (type === "generated_image") {
            const imageUrl = item.image_url || item.content || item.url;
            if (imageUrl) {
              addTimelineMessage(
                {
                  role: "assistant",
                  content: item.caption || item.description || "",
                  image: imageUrl,
                },
                timestamp
              );
            }
          } else if (type === "chatbot_message" || type === "assistant_message" || type === "assistant") {
            addTimelineMessage(
              {
                role: "assistant",
                content: item.content || "",
                image: item.image_url || undefined,
              },
              timestamp
            );
          }
        }

        for (const imageEntry of imageHistory) {
          if (!imageEntry || typeof imageEntry !== "object") continue;
          const imageUrl = imageEntry.url || imageEntry.image_url || imageEntry.content;
          if (!imageUrl) continue;

          const timestamp =
            imageEntry.generated_at || imageEntry.timestamp || imageEntry.created_at || imageEntry.updated_at;

          addTimelineMessage(
            {
              role: "assistant",
              content: imageEntry.caption || imageEntry.step_description || "",
              image: imageUrl,
            },
            timestamp
          );
        }

        timeline.sort((a, b) => {
          if (a.timestamp === b.timestamp) {
            return a.order - b.order;
          }
          return a.timestamp - b.timestamp;
        });

        const sortedMessages: Message[] = timeline
          .map((entry) => entry.message)
          .filter((message) => Boolean(message.content?.trim()) || Boolean(message.image));

        const dedupedMessages: Message[] = [];
        const seenMessages = new Set<string>();
        let lastAssistantStep: string | null = null;
        for (const message of sortedMessages) {
          const key = `${message.role}|${message.content ?? ""}|${message.image ?? ""}`;
          if (seenMessages.has(key)) continue;

          if (message.role === "assistant" && message.content) {
            const trimmedContent = message.content.trim();
            const stepMatch = trimmedContent.match(/^\*\*Step\s+\d+\/\d+:\*\*/i);
            if (stepMatch) {
              if (trimmedContent === lastAssistantStep) {
                continue;
              }
              lastAssistantStep = trimmedContent;
            }
          }

          if (message.role === "assistant" && message.content?.toLowerCase().includes("loading chat history")) {
            continue;
          }

          seenMessages.add(key);
          dedupedMessages.push(message);
        }

        if (dedupedMessages.length === 0 && initialRecommendations) {
          dedupedMessages.push({
            role: "assistant",
            content: `Here are your top 3 recipe recommendations:\n\n${initialRecommendations}`,
          });
        }

        setMessages(dedupedMessages);

        const extractRecipeName = (): string | null => {
          for (let i = dedupedMessages.length - 1; i >= 0; i -= 1) {
            const msg = dedupedMessages[i];
            if (!msg.content) continue;

            if (msg.role === "assistant") {
              const letsCookMatch = msg.content.match(/let['’]s cook\s+([^.!\n]+)/i);
              if (letsCookMatch?.[1]) {
                return letsCookMatch[1].trim();
              }

              const walkingMatch = msg.content.match(/currently walking through\s+([^.!\n]+)/i);
              if (walkingMatch?.[1]) {
                return walkingMatch[1].trim();
              }
            }

            if (msg.role === "user") {
              const showMeMatch = msg.content.match(/show me how to make\s+([^.!\n]+)/i);
              if (showMeMatch?.[1]) {
                return showMeMatch[1].trim();
              }
            }
          }
          return null;
        };

        const detectedRecipeName = extractRecipeName();
        if (detectedRecipeName) {
          setCurrentRecipe((prev) => (prev ? prev : detectedRecipeName));
        }

        const recommendationCandidates = dedupedMessages.filter((m) => {
          if (m.role !== "assistant" || !m.content) return false;
          const contentLower = m.content.toLowerCase();
          if (contentLower.includes("congratulations")) return false;
          if (contentLower.includes("great choice")) return false;
          if (contentLower.includes("let's cook")) return false;

          return (
            contentLower.includes("recommendations") ||
            contentLower.includes("top 3") ||
            contentLower.includes("top three") ||
            contentLower.includes("recipe ranking") ||
            m.content.match(/^\d+\.\s/m)
          );
        });

        const combinedRecommendationText = recommendationCandidates
          .map((m) => m.content ?? "")
          .join("\n");

        const recommendationSource =
          combinedRecommendationText || initialRecommendations || "";

        if (recommendationSource) {
          const parsed = parseRecipeNames(recommendationSource);
          if (parsed.length > 0 && !parsed.every((recipe) => recipe.startsWith("Recipe "))) {
            setRecipeNames(parsed);
          } else if (initialRecommendations) {
            setRecipeNames(parseRecipeNames(initialRecommendations));
          } else {
            setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
          }
        } else {
          setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
        }

        setMessagesLoaded(true);
      } else {
        if (initialRecommendations) {
          const fallbackMsg = {
            role: "assistant" as const,
            content: `Here are your top 3 recipe recommendations:\n\n${initialRecommendations}`,
          };
          setMessages([fallbackMsg]);
          setRecipeNames(parseRecipeNames(initialRecommendations));
        } else {
          setMessages([]);
          setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
        }
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      historyLoadedRef.current = false;
      if (initialRecommendations) {
        const fallbackMsg = {
          role: "assistant" as const,
          content: `Here are your top 3 recipe recommendations:\n\n${initialRecommendations}`,
        };
        setMessages([fallbackMsg]);
        setRecipeNames(parseRecipeNames(initialRecommendations));
      } else {
        setMessages([]);
        setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
      }
      setMessagesLoaded(true);
    }
  }, [initialRecommendations, messagesLoaded, session?.user?.email, sessionId]);

  const checkSessionOwnership = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/session/${sessionId}`, {
        headers: {
          "X-User-Email": session.user.email,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsReadOnly(!data.is_owner);
        const detectedRecipe =
          data.current_recipe ||
          data.selected_recipe_name ||
          data.currentRecipe ||
          data.selectedRecipeName;
        if (detectedRecipe && typeof detectedRecipe === "string") {
          setCurrentRecipe((prev) => (prev ? prev : detectedRecipe));
        }
      } else if (response.status === 404) {
        setIsReadOnly(false);
      }
    } catch (error) {
      console.error("Failed to check session ownership:", error);
      setIsReadOnly(false);
    }
  }, [session?.user?.email, sessionId]);

  useEffect(() => {
    void checkSessionOwnership();
    void loadChatHistory();
  }, [checkSessionOwnership, loadChatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectRecipe = async (recipeName: string) => {
    if (isReadOnly) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "This is a shared session. Only the owner can select recipes.",
        },
      ]);
      return;
    }

    setLoading(true);
    setCurrentRecipe(recipeName);

    try {
      const data = await getRecipeDetails(sessionId, recipeName);

      if (data.success) {
        setTotalSteps(data.steps.length);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `Show me how to make ${recipeName}` },
          {
            role: "assistant",
            content: `Great choice! Let's cook ${recipeName}.\n\n**Ingredients:**\n${data.ingredients}\n\n**Tips:**\n${data.tips}\n\nClick "Next Step" to start cooking!`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error getting recipe details:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't load the recipe details. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (isReadOnly) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "This is a shared session. Only the owner can interact.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const data = await getNextStep(sessionId);

      if (data.completed) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `🎉 Congratulations! You've completed all steps!${data.tips ? `\n\n${data.tips}` : ""}`,
          },
        ]);
      } else {
        setCurrentStep(data.step_number);
        const stepContent = data.step || data.current_step || "Step information";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Step ${data.step_number}/${data.total_steps}:**\n${stepContent}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error getting next step:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't load the next step. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (isReadOnly) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "This is a shared session. Only the owner can generate images.",
        },
      ]);
      return;
    }

    if (imageLimitReached) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "You've reached your daily image generation limit. Please try again tomorrow!",
        },
      ]);
      return;
    }

    setLoading(true);
    setGeneratingImage(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "GENERATING_IMAGE" },
    ]);

    try {
      if (!session?.user?.email) {
        throw new Error("User email not available");
      }

      const data = await generateStepImage(sessionId, session.user.email);

      setMessages((prev) => prev.filter((msg) => msg.content !== "GENERATING_IMAGE"));

      if (data.success) {
        const imageUrl =
          (typeof data.image_url === "string" && data.image_url) ||
          (data.image_data ? `data:image/png;base64,${data.image_data}` : "");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            image: imageUrl,
          },
        ]);

        setTimeout(async () => {
          if (!session?.user?.email) return;

          try {
            const response = await fetch(
              `${API_CONFIG.BASE_URL}/api/image-generation/check-limit`,
              {
                headers: {
                  "X-User-Email": session.user.email,
                },
              }
            );
            if (response.ok) {
              const creditsData = await response.json();
              setCreditsPopup({
                show: true,
                remaining: creditsData.remaining_count,
                max: creditsData.max_allowed,
                allowed: creditsData.allowed,
              });
              setTimeout(() => {
                setCreditsPopup(null);
              }, 4000);
            }
          } catch (error) {
            console.error("Failed to fetch credits:", error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setMessages((prev) => prev.filter((msg) => msg.content !== "GENERATING_IMAGE"));

      const errorMessage =
        error instanceof Error ? error.message : typeof error === "string" ? error : "";

      if (errorMessage.toLowerCase().includes("limit") || errorMessage.includes("403")) {
        setImageLimitReached(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "You've reached your daily image generation limit. Please try again tomorrow!",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't generate the image. Please try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  const handleSkip = async () => {
    if (isReadOnly) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "This is a shared session. Only the owner can interact.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      await skipSteps(sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Skipped remaining steps. You can ask for ingredient alternatives if needed!",
        },
      ]);
    } catch (error) {
      console.error("Error skipping:", error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowSelection = (message: Message, index: number) => {
    if (message.role !== "assistant") return false;
    if (currentRecipe || recipeNames.length === 0) return false;
    const content = message.content || "";
    return (
      index === 0 ||
      content.includes("recommendations") ||
      content.includes("recipe") ||
      content.includes("ranking") ||
      /^\d+\./.test(content)
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {isReadOnly && (
        <div className="rounded-2xl border border-yellow-300/70 bg-yellow-50/80 px-5 py-4 text-sm font-medium text-yellow-900 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4" />
            <span>Read-only mode: This is a shared session. You can view but not interact.</span>
          </div>
        </div>
      )}

      {!messagesLoaded ? (
        <Card className="h-[600px] items-center justify-center border-border/60 bg-white/95 text-center shadow-xl shadow-brand/15 dark:border-border/40 dark:bg-card/90">
          <CardContent className="flex flex-col items-center gap-4 pt-10">
            <div className="rounded-2xl border border-orange-200/60 bg-orange-50/80 p-4 text-orange-500 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground">Loading your chat history</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              We&apos;re fetching your previous cooking steps and recommendations.
            </p>
            <span className="loading loading-spinner loading-lg text-orange-500" />
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border border-border/70 bg-white/95 shadow-2xl shadow-brand/20 backdrop-blur dark:border-border/40 dark:bg-card/90">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,229,204,0.35),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,140,66,0.2),_transparent_65%)]" />
          <CardHeader className="relative border-b border-border/60 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-brand-surface/80 p-3 text-primary shadow-inner shadow-brand/30">
                  <UtensilsCrossed className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold text-foreground">
                    Your Cooking Companion
                  </CardTitle>
                  <CardDescription className="max-w-xl text-base">
                    {currentRecipe
                      ? `Currently walking through ${currentRecipe}. Continue when you're ready.`
                      : "Choose a recipe to start cooking together or ask for further guidance."}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                    <Badge variant="outline" size="sm" className="gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Session ID: {sessionId}
                    </Badge>
                    {currentRecipe && (
                      <Badge variant="glow" size="sm" className="gap-2">
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        {currentRecipe}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge
                variant={isReadOnly ? "outline" : "glow"}
                size="sm"
                className="gap-2 self-start"
              >
                {isReadOnly ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Read only
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Active session
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative p-0">
            <ScrollArea className="h-[520px] px-6 py-6">
              <div className="flex flex-col gap-6">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  const isGenerating = msg.content === "GENERATING_IMAGE";
                  const showSelection = shouldShowSelection(msg, idx);

                  return (
                    <div
                      key={`${msg.role}-${idx}-${msg.content?.slice(0, 12)}`}
                      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "flex max-w-full flex-col gap-4",
                          isUser ? "items-end" : "items-start"
                        )}
                      >
                        {isGenerating ? (
                          <div className="flex w-full justify-center">
                            <ImageGeneratingAnimation />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "max-w-[80vw] rounded-3xl border border-border/60 px-5 py-4 text-sm shadow-sm transition-all md:max-w-[70%]",
                              isUser
                                ? "bg-brand-gradient text-primary-foreground shadow-brand-glow"
                                : "bg-white/95 text-foreground backdrop-blur-sm dark:bg-slate-800/80 dark:text-white"
                            )}
                          >
                            <MarkdownRenderer content={msg.content} />
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="Step visualization"
                                className="mt-4 w-full rounded-2xl border border-white/50 object-cover shadow-sm"
                              />
                            )}
                          </div>
                        )}

                        {showSelection && (
                          <div className="w-full rounded-3xl border border-border/60 bg-white/90 p-5 shadow-inner shadow-brand/10 backdrop-blur dark:bg-slate-800/80">
                            <p className="text-sm font-semibold text-muted-foreground">
                              Select a recipe to start cooking:
                            </p>
                            <div className="mt-4 space-y-2">
                              {recipeNames.map((recipe) => (
                                <Button
                                  key={recipe}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={loading || isReadOnly}
                                  className="w-full justify-between rounded-2xl border-border/60 bg-white/90 text-left text-sm font-semibold text-foreground transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed dark:bg-slate-900/40 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-500/20"
                                  onClick={() => handleSelectRecipe(recipe)}
                                >
                                  {recipe}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && !generatingImage && (
                  <div className="flex justify-center rounded-2xl border border-dashed border-border/60 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground shadow-inner shadow-brand/10">
                    <div className="flex flex-col items-center gap-3">
                      <LoadingSpinner message="Processing..." />
                      <span>Hang tight, we&apos;re working on your request.</span>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          {currentRecipe && !isReadOnly && (
            <CardFooter className="relative flex flex-col gap-4 border-t border-border/60 bg-white/90 px-6 py-6 backdrop-blur dark:bg-slate-900/70">
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="gradient"
                  size="lg"
                  className="gap-2"
                  disabled={loading}
                  onClick={handleNextStep}
                >
                  <ArrowRight className="h-4 w-4" />
                  Next Step
                </Button>

                <div className="relative">
                  <Button
                    type="button"
                    variant="gradient"
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                    disabled={loading || generatingImage || imageLimitReached}
                    onClick={handleGenerateImage}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {generatingImage ? "Generating..." : "Generate Image"}
                  </Button>

                  {creditsPopup?.show && (
                    <div className="absolute bottom-full left-1/2 z-50 mb-3 w-max -translate-x-1/2 rounded-2xl border border-orange-200/70 bg-white/95 px-4 py-3 text-sm shadow-2xl shadow-brand/30 backdrop-blur dark:border-orange-400/40 dark:bg-slate-900/90">
                      <div className="flex items-center gap-2 font-semibold text-orange-600 dark:text-orange-300">
                        <ImageIcon className="h-4 w-4" />
                        Image credits
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-bold",
                          creditsPopup.allowed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {creditsPopup.allowed
                          ? `${creditsPopup.remaining} / ${creditsPopup.max} remaining`
                          : "Limit reached"}
                      </div>
                      {!creditsPopup.allowed && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try again tomorrow for fresh credits.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  disabled={loading}
                  onClick={handleSkip}
                >
                  <FastForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>

              {currentStep > 0 && (
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </p>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
