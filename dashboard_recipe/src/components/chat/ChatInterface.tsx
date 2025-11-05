"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FaArrowRight, FaImage, FaForward, FaLock } from "react-icons/fa";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ImageGeneratingAnimation from "@/components/ImageGeneratingAnimation";
import { 
  getRecipeDetails, 
  getNextStep, 
  generateStepImage, 
  skipSteps 
} from "@/services/cookingStepsApi";
import { API_CONFIG } from "@/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  initialRecommendations: string;
}

export default function ChatInterface({ sessionId, initialRecommendations }: ChatInterfaceProps) {
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
  
  // Parse recipe names from recommendations text
  const parseRecipeNames = (text: string): string[] => {
    if (!text) return ["Recipe 1", "Recipe 2", "Recipe 3"];
    
    const recipes: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // First, try to match bold recipe names directly (like "**Maharashtrian Gopalkala Recipe**")
      const boldMatch = line.match(/\*\*([^*]+?)\*\*/);
      if (boldMatch && boldMatch[1]) {
        let recipeName = boldMatch[1].trim();
        // Remove trailing parentheses content like "(Curd Poha With Fruits)"
        recipeName = recipeName.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (recipeName && 
            recipeName.length > 3 && 
            recipeName.length < 100 &&
            !recipes.includes(recipeName) &&
            !recipeName.toLowerCase().startsWith('recipe ')) {
          recipes.push(recipeName);
          continue;  // Found a bold recipe name, move to next line
        }
      }
      
      // Then try numbered patterns:
      // "1. Recipe Name"
      // "Recipe 1: Name"  
      // "**1. Name**"
      // "1. Name - description"
      const patterns = [
        /^\*?\*?\s*(\d+)\.\s*\*?\*?\s*(.+?)(?:\s*[-–—\(]|$)/i,  // "1. Recipe Name" or "**1. Name**"
        /^Recipe\s+(\d+)[:\.]?\s*(.+?)(?:\s*[-–—\(]|$)/i,  // "Recipe 1: Name"
        /^\*\*(\d+)\.\s*(.+?)\*\*/i,  // "**1. Name**"
        /^(\d+)\.\s*(.+?)(?:\s*\(|$)/i,  // "1. Name (description)"
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[2]) {
          let recipeName = match[2].trim();
          // Clean up markdown and formatting
          recipeName = recipeName
            .replace(/\*\*/g, '')  // Remove bold
            .replace(/^[-–—]\s*/, '')  // Remove leading dashes
            .replace(/\s*\(.*?\)\s*$/, '')  // Remove trailing parentheses
            .replace(/\s*[-–—].*$/, '')  // Remove everything after dash
            .trim();
          
          // Validate recipe name
          if (recipeName && 
              recipeName.length > 3 && 
              recipeName.length < 100 &&  // Reasonable length
              !recipes.includes(recipeName) &&
              !recipeName.toLowerCase().startsWith('recipe ') &&  // Avoid "Recipe 1" as name
              !recipeName.match(/^\d+$/)) {  // Not just a number
            recipes.push(recipeName);
            break;  // Found a match, move to next line
          }
        }
      }
    }
    
    // If we found recipes, return them (limit to 3)
    if (recipes.length > 0) {
      return recipes.slice(0, 3);
    }
    
    // Fallback: try to find any line that looks like a recipe (starts with bold or number)
    for (const line of lines) {
      if (line.trim().length > 10 && line.trim().length < 80) {
        // Check for bold text
        const boldMatch = line.match(/\*\*([^*]+?)\*\*/);
        if (boldMatch && boldMatch[1]) {
          const cleaned = boldMatch[1].trim().replace(/\s*\([^)]*\)\s*$/, '').trim();
          if (cleaned && cleaned.length > 5 && !recipes.includes(cleaned)) {
            recipes.push(cleaned);
            if (recipes.length >= 3) break;
          }
        } else {
          // Check for numbered lines
          const cleaned = line.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
          if (cleaned && cleaned.length > 5 && !recipes.includes(cleaned)) {
            recipes.push(cleaned);
            if (recipes.length >= 3) break;
          }
        }
      }
    }
    
    return recipes.length > 0 ? recipes.slice(0, 3) : ["Recipe 1", "Recipe 2", "Recipe 3"];
  };

  // Load chat history and check ownership on mount
  useEffect(() => {
    checkSessionOwnership();
    loadChatHistory();
  }, [session, sessionId]);

  const loadChatHistory = async () => {
    if (!session?.user?.email || messagesLoaded) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/session/${sessionId}/history`,
        {
          headers: {
            "X-User-Email": session.user.email,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const chatHistory = data.chat_history || [];
        
        // Convert chat history to messages
        const loadedMessages: Message[] = [];
        
        for (const item of chatHistory) {
          if (item.type === "user_message" || item.message_type === "user_message") {
            loadedMessages.push({
              role: "user",
              content: item.content || "",
            });
          } else if (item.type === "chatbot_message" || item.message_type === "chatbot_message") {
            loadedMessages.push({
              role: "assistant",
              content: item.content || "",
              image: item.image_url || undefined,
            });
          } else if (item.type === "generated_image" || item.message_type === "generated_image") {
            loadedMessages.push({
              role: "assistant",
              content: "",
              image: item.content || item.image_url || undefined,
            });
          }
        }
        
        // If no history, use initial recommendations
        if (loadedMessages.length === 0 && initialRecommendations) {
          loadedMessages.push({
            role: "assistant",
            content: "Here are your top 3 recipe recommendations:\n\n" + initialRecommendations,
          });
        }
        
        setMessages(loadedMessages);
        
        // Extract recipe names from recommendations
        // Look for the message that contains recommendations
        const recommendationsMessage = loadedMessages.find(
          m => m.role === "assistant" && 
               m.content && 
               (m.content.includes("recommendations") || 
                m.content.includes("recipe ranking") ||
                m.content.includes("ranking:") ||
                m.content.match(/^\d+\./))
        ) || loadedMessages.find(m => m.role === "assistant" && m.content);
        
        const allRecommendations = loadedMessages
          .filter(m => m.role === "assistant" && m.content)
          .map(m => m.content)
          .join("\n");
        
        if (allRecommendations) {
          const parsed = parseRecipeNames(allRecommendations);
          console.log("Parsed recipe names from history:", parsed);
          if (parsed.length > 0 && !parsed.every(r => r.startsWith("Recipe "))) {
            setRecipeNames(parsed);
          } else if (initialRecommendations) {
            // Try parsing initial recommendations if loaded ones didn't work
            const parsed = parseRecipeNames(initialRecommendations);
            console.log("Parsed recipe names from initial:", parsed);
            setRecipeNames(parsed);
          } else {
            console.log("No recommendations found, using defaults");
            setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
          }
        } else if (initialRecommendations) {
          const parsed = parseRecipeNames(initialRecommendations);
          setRecipeNames(parsed);
        } else {
          setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
        }
        
        setMessagesLoaded(true);
      } else {
        // Fallback to initial recommendations - don't fail completely
        console.warn("Failed to load chat history:", response.status);
        if (initialRecommendations) {
          const fallbackMsg = { role: "assistant" as const, content: "Here are your top 3 recipe recommendations:\n\n" + initialRecommendations };
          setMessages([fallbackMsg]);
          const parsed = parseRecipeNames(initialRecommendations);
          setRecipeNames(parsed);
        } else {
          // Still show empty messages so UI doesn't break
          setMessages([]);
          setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
        }
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Fallback to initial recommendations - don't fail completely
      if (initialRecommendations) {
        const fallbackMsg = { role: "assistant" as const, content: "Here are your top 3 recipe recommendations:\n\n" + initialRecommendations };
        setMessages([fallbackMsg]);
        const parsed = parseRecipeNames(initialRecommendations);
        setRecipeNames(parsed);
      } else {
        // Still show empty messages so UI doesn't break
        setMessages([]);
        setRecipeNames(["Recipe 1", "Recipe 2", "Recipe 3"]);
      }
      setMessagesLoaded(true);
    }
  };

  const checkSessionOwnership = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/session/${sessionId}`,
        {
          headers: {
            "X-User-Email": session.user.email,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsReadOnly(!data.is_owner);
      } else {
        // If 404, assume ownership (new session)
        if (response.status === 404) {
          setIsReadOnly(false);
        }
      }
    } catch (error) {
      console.error("Failed to check session ownership:", error);
      // On error, default to non-read-only (allow interaction)
      setIsReadOnly(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectRecipe = async (recipeName: string) => {
    if (isReadOnly) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "This is a shared session. Only the owner can select recipes." }
      ]);
      return;
    }

    setLoading(true);
    setCurrentRecipe(recipeName);
    
    try {
      const data = await getRecipeDetails(sessionId, recipeName);
      
      if (data.success) {
        setTotalSteps(data.steps.length);
        setMessages(prev => [
          ...prev, 
          { role: "user", content: `Show me how to make ${recipeName}` },
          { 
            role: "assistant", 
            content: `Great choice! Let's cook ${recipeName}.\n\n**Ingredients:**\n${data.ingredients}\n\n**Tips:**\n${data.tips}\n\nClick "Next Step" to start cooking!` 
          }
        ]);
      }
    } catch (error) {
      console.error("Error getting recipe details:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't load the recipe details. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (isReadOnly) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "This is a shared session. Only the owner can interact." }
      ]);
      return;
    }

    setLoading(true);
    try {
      const data = await getNextStep(sessionId);
      
      if (data.completed) {
        setMessages(prev => [
          ...prev, 
          { role: "assistant", content: "🎉 Congratulations! You've completed all steps!" + (data.tips ? `\n\n${data.tips}` : "") }
        ]);
      } else {
        setCurrentStep(data.step_number);
        const stepContent = data.step || data.current_step || "Step information";
        setMessages(prev => [
          ...prev, 
          { role: "assistant", content: `**Step ${data.step_number}/${data.total_steps}:**\n${stepContent}` }
        ]);
      }
    } catch (error) {
      console.error("Error getting next step:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't load the next step. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (isReadOnly) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "This is a shared session. Only the owner can generate images." }
      ]);
      return;
    }

    if (imageLimitReached) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "You've reached your daily image generation limit. Please try again tomorrow!" }
      ]);
      return;
    }

    setLoading(true);
    setGeneratingImage(true);
    
    // Add animation message immediately
    setMessages(prev => [
      ...prev, 
      { role: "assistant", content: "GENERATING_IMAGE" } // Special marker
    ]);
    
    try {
      if (!session?.user?.email) {
        throw new Error("User email not available");
      }
      
      const data = await generateStepImage(sessionId, session.user.email);
      
      // Remove the animation message
      setMessages(prev => prev.filter(msg => msg.content !== "GENERATING_IMAGE"));
      
      if (data.success) {
        // Use image_url if available (from S3), otherwise use base64
        const imageUrl = (data as any).image_url || (data.image_data ? `data:image/png;base64,${data.image_data}` : "");
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: ``,
            image: imageUrl 
          }
        ]);
        
        // Fetch and show credits popup after successful generation
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
              // Auto-hide after 4 seconds
              setTimeout(() => {
                setCreditsPopup(null);
              }, 4000);
            }
          } catch (error) {
            console.error("Failed to fetch credits:", error);
          }
        }, 1000); // Wait for backend to update
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      // Remove the animation message
      setMessages(prev => prev.filter(msg => msg.content !== "GENERATING_IMAGE"));
      
      // Check if it's a limit error
      if (error.message?.includes("limit") || error.message?.includes("403")) {
        setImageLimitReached(true);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "You've reached your daily image generation limit. Please try again tomorrow!" }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't generate the image. Please try again." }
        ]);
      }
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  const handleSkip = async () => {
    if (isReadOnly) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "This is a shared session. Only the owner can interact." }
      ]);
      return;
    }

    setLoading(true);
    try {
      await skipSteps(sessionId);
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Skipped remaining steps. You can ask for ingredient alternatives if needed!" }
      ]);
    } catch (error) {
      console.error("Error skipping:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Read-only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-500 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl mb-4 flex items-center gap-2">
          <FaLock />
          <span className="font-medium">Read-only mode: This is a shared session. You can view but not interact.</span>
        </div>
      )}


      {/* Messages Container */}
      {!messagesLoaded ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-4 h-[600px] flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-orange-500"></span>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading chat history...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-2xl shadow-xl p-6 mb-4 h-[600px] overflow-y-auto dark:shadow-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === "user" ? "text-right" : msg.content === "GENERATING_IMAGE" ? "text-center" : ""}`}>
            {/* Special case: Image generation animation */}
            {msg.content === "GENERATING_IMAGE" ? (
              <div className="w-full flex justify-center">
                <ImageGeneratingAnimation />
              </div>
            ) : (
              <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user" 
                  ? "bg-orange-500 dark:bg-orange-600 text-white" 
                  : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100"
              }`}>
                <MarkdownRenderer content={msg.content} />
                {msg.image && (
                  <img src={msg.image} alt="Step visualization" className="mt-3 rounded-lg max-w-full" />
                )}
              </div>
            )}
            
            {/* Recipe Selection Buttons */}
            {msg.role === "assistant" && 
             !currentRecipe && 
             recipeNames.length > 0 && 
             (msg.content.includes("recommendations") || 
              msg.content.includes("recipe") || 
              msg.content.includes("ranking") ||
              msg.content.match(/^\d+\./) ||
              idx === 0) && (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
                  Select a recipe to start:
                </p>
                {recipeNames.map((recipe, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectRecipe(recipe)}
                    disabled={loading || isReadOnly}
                    className="block w-full text-left bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-white dark:border dark:border-orange-700 p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {recipe}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Only show LoadingSpinner when not generating images */}
        {loading && !generatingImage && (
          <div className="text-center py-4">
            <LoadingSpinner message="Processing..." />
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Please wait...</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>
      )}

      {/* Action Buttons */}
      {currentRecipe && !isReadOnly && (
        <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 rounded-2xl shadow-xl p-4">
          <div className="flex gap-3">
            <button
              onClick={handleNextStep}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaArrowRight /> Next Step
            </button>
            
            <div className="flex-1 relative">
              <button
                onClick={handleGenerateImage}
                disabled={loading || generatingImage || imageLimitReached}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FaImage /> {generatingImage ? "Generating..." : "Generate Image"}
              </button>
              
              {/* Credits Popup */}
              {creditsPopup?.show && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 transition-opacity duration-300 opacity-100">
                  <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-2xl p-3 min-w-[200px] ${
                    creditsPopup.allowed 
                      ? "border-green-500 dark:border-green-400" 
                      : "border-red-500 dark:border-red-400"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FaImage className={`${creditsPopup.allowed ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`} />
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        Image Credits
                      </span>
                    </div>
                    <div className={`text-sm font-bold ${
                      creditsPopup.allowed 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {creditsPopup.allowed 
                        ? `${creditsPopup.remaining} / ${creditsPopup.max} remaining`
                        : "Limit reached"
                      }
                    </div>
                    {!creditsPopup.allowed && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Try again tomorrow
                      </p>
                    )}
                  </div>
                  {/* Arrow pointing to button */}
                  <div className={`absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                    creditsPopup.allowed 
                      ? "border-t-green-500 dark:border-t-green-400" 
                      : "border-t-red-500 dark:border-t-red-400"
                  }`}></div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gray-500 to-slate-500 dark:from-gray-600 dark:to-slate-600 hover:from-gray-600 hover:to-slate-600 dark:hover:from-gray-700 dark:hover:to-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaForward /> Skip
            </button>
          </div>
          
          {currentStep > 0 && (
            <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
