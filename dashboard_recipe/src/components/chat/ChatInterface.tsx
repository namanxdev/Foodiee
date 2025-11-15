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

      console.log("Image generation response:", data);

      setMessages((prev) => prev.filter((msg) => msg.content !== "GENERATING_IMAGE"));

      if (data.success) {
        // Prioritize image_url (S3 URL) over base64 image_data
        let imageUrl = "";
        if (data.image_url && typeof data.image_url === "string" && data.image_url.trim() !== "") {
          imageUrl = data.image_url;
          console.log("Using S3 image URL:", imageUrl);
        } else if (data.image_data && typeof data.image_data === "string") {
          imageUrl = `data:image/png;base64,${data.image_data}`;
          console.log("Using base64 image data");
        }
        
        if (imageUrl) {
          console.log("Adding image message to chat with URL:", imageUrl);
          const newMessage = {
            role: "assistant" as const,
            content: "", // Only show image, no text
            image: imageUrl,
          };
          console.log("New message object:", newMessage);
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            console.log("Updated messages array:", updated);
            return updated;
          });
        } else {
          console.warn("No image URL or data found in response:", data);
          // Fallback if no image but description exists
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.description || "Image generation completed, but no image was returned.",
            },
          ]);
        }

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {isReadOnly && (
        <div className="rounded-2xl border border-yellow-300/70 bg-yellow-50/80 px-5 py-3 text-sm font-medium text-yellow-900 shadow-sm backdrop-blur dark:border-yellow-400/40 dark:bg-yellow-500/10 dark:text-yellow-200">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4" />
            <span>Read-only mode: This is a shared session. You can view but not interact.</span>
          </div>
        </div>
      )}

      {!messagesLoaded ? (
        <div className="flex h-[600px] items-center justify-center rounded-3xl border border-white/20 bg-black/40 text-center shadow-xl shadow-brand/15 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-orange-400/40 bg-orange-500/20 p-4 text-orange-400 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-white">Loading your chat history</p>
            <p className="max-w-sm text-sm text-white/70">
              We&apos;re fetching your previous cooking steps and recommendations.
            </p>
            <span className="loading loading-spinner loading-lg text-orange-500" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col rounded-3xl border border-white/20 bg-black/40 shadow-2xl shadow-brand/20 backdrop-blur">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand-glow">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Cooking Assistant</h3>
                {currentRecipe && (
                  <p className="text-xs text-white/60">{currentRecipe}</p>
                )}
              </div>
            </div>
            <Badge
              variant={isReadOnly ? "outline" : "glow"}
              size="sm"
              className="gap-2 bg-green-600"
            >
              {isReadOnly ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Read only
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Active
                </>
              )}
            </Badge>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="h-[500px] px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isGenerating = msg.content === "GENERATING_IMAGE";
                const showSelection = shouldShowSelection(msg, idx);
                
                // Debug logging for image messages
                if (msg.image) {
                  console.log(`Message ${idx} has image:`, msg.image, "Content:", msg.content);
                }

                return (
                  <div
                    key={`${msg.role}-${idx}-${msg.content?.slice(0, 12)}`}
                    className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                        <UtensilsCrossed className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex max-w-[75%] flex-col gap-2",
                        isUser ? "items-end" : "items-start"
                      )}
                    >
                      {isGenerating ? (
                        <div className="flex w-full justify-center">
                          <ImageGeneratingAnimation />
                        </div>
                      ) : (
                        <>
                          {msg.content && msg.content.trim() && (
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                                isUser
                                  ? "bg-gradient-to-br from-[#FF5A2F] to-[#FF7A45] text-white rounded-br-sm"
                                  : "bg-white/10 text-white rounded-bl-sm backdrop-blur-sm border border-white/20"
                              )}
                            >
                              <MarkdownRenderer content={msg.content} />
                            </div>
                          )}
                          {msg.image && (
                            <div className="relative w-full max-w-[500px] aspect-video overflow-hidden rounded-xl border border-white/20 shadow-sm bg-black/10" style={{ minHeight: '200px' }}>
                              <img
                                src={msg.image}
                                alt="Step visualization"
                                className="w-full h-full object-cover"
                                style={{ display: 'block' }}
                                onError={(e) => {
                                  console.error("Image load error:", msg.image);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log("Image loaded successfully:", msg.image);
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}

                      {showSelection && (
                        <div className="w-full rounded-2xl border border-white/20 bg-black/40 p-4 shadow-inner backdrop-blur-sm">
                          <p className="mb-3 text-sm font-semibold text-white/90">
                            Select a recipe to start cooking:
                          </p>
                          <div className="space-y-2">
                            {recipeNames.map((recipe) => (
                              <Button
                                key={recipe}
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loading || isReadOnly}
                                className="w-full justify-between rounded-xl border-white/20 bg-white/10 text-left text-sm font-semibold text-white transition hover:border-orange-400 hover:bg-orange-500/20 hover:text-white disabled:cursor-not-allowed"
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
                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
                        <span className="text-xs font-semibold">You</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && !generatingImage && (
                <div className="flex justify-center py-4">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner message="Processing..." />
                    <span className="text-xs text-white/70">Hang tight, we&apos;re working on your request.</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Chat Actions */}
          {currentRecipe && !isReadOnly && (
            <div className="border-t border-white/20 bg-black/30 px-4 py-4 backdrop-blur-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[#FF5A2F] via-[#FF7A45] to-[#FFD07F] hover:from-[#FF6A3F] hover:via-[#FF8A55] hover:to-[#FFE08F] text-[#1E1E1E] font-semibold shadow-lg shadow-orange-500/40 border-0"
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
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                    disabled={loading || generatingImage || imageLimitReached}
                    onClick={handleGenerateImage}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {generatingImage ? "Generating..." : "Generate Image"}
                  </Button>

                  {creditsPopup?.show && (
                    <div className="absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded-xl border border-orange-200/70 bg-white/95 px-3 py-2 text-xs shadow-2xl shadow-brand/30 backdrop-blur dark:border-orange-400/40 dark:bg-slate-900/90">
                      <div className="flex items-center gap-2 font-semibold text-orange-600 dark:text-orange-300">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Image credits
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-xs font-bold",
                          creditsPopup.allowed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {creditsPopup.allowed
                          ? `${creditsPopup.remaining} / ${creditsPopup.max} remaining`
                          : "Limit reached"}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:via-orange-400 hover:to-amber-500 text-white border-0 shadow-lg shadow-amber-500/30"
                  disabled={loading}
                  onClick={handleSkip}
                >
                  <FastForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>

              {currentStep > 0 && (
                <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-white/70">
                  Step {currentStep} of {totalSteps}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
