"use client";

import { useState, useEffect, useRef } from "react";
import { FaArrowRight, FaImage, FaForward } from "react-icons/fa";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ImageGeneratingAnimation from "@/components/ImageGeneratingAnimation";
import { 
  getRecipeDetails, 
  getNextStep, 
  generateStepImage, 
  skipSteps 
} from "@/services/cookingStepsApi";

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
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Here are your top 3 recipe recommendations:\n\n" + initialRecommendations }
  ]);
  const [currentRecipe, setCurrentRecipe] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectRecipe = async (recipeName: string) => {
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
    setLoading(true);
    setGeneratingImage(true);
    
    // Add animation message immediately
    setMessages(prev => [
      ...prev, 
      { role: "assistant", content: "GENERATING_IMAGE" } // Special marker
    ]);
    
    try {
      const data = await generateStepImage(sessionId);
      
      // Remove the animation message
      setMessages(prev => prev.filter(msg => msg.content !== "GENERATING_IMAGE"));
      
      if (data.success) {
        const imageUrl = data.image_data ? `data:image/png;base64,${data.image_data}` : "";
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: ``,
            // content: `**Visual Guide:**\n${data.description}`,
            image: imageUrl 
          }
        ]);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Remove the animation message
      setMessages(prev => prev.filter(msg => msg.content !== "GENERATING_IMAGE"));
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't generate the image. Please try again." }
      ]);
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  const handleSkip = async () => {
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
      {/* Messages Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-4 h-[600px] overflow-y-auto dark:shadow-slate-900/50">
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
                  ? "bg-orange-500 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}>
                <MarkdownRenderer content={msg.content} />
                {msg.image && (
                  <img src={msg.image} alt="Step visualization" className="mt-3 rounded-lg max-w-full" />
                )}
              </div>
            )}
            
            {/* Recipe Selection Buttons */}
            {idx === 0 && msg.role === "assistant" && !currentRecipe && (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Select a recipe to start:
                </p>
                {["Recipe 1", "Recipe 2", "Recipe 3"].map((recipe, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectRecipe(recipe)}
                    disabled={loading}
                    className="block w-full text-left bg-orange-100 hover:bg-orange-200 p-3 rounded-lg transition dark:text-gray-900 dark:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select {recipe}
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
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      {currentRecipe && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-850 dark:to-orange-900/10 rounded-2xl shadow-xl p-4 dark:shadow-orange-900/20">
          <div className="flex gap-3">
            <button
              onClick={handleNextStep}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaArrowRight /> Next Step
            </button>
            
            <button
              onClick={handleGenerateImage}
              disabled={loading || generatingImage}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaImage /> {generatingImage ? "Generating..." : "Generate Image"}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaForward /> Skip
            </button>
          </div>
          
          {currentStep > 0 && (
            <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep} of {totalSteps}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
