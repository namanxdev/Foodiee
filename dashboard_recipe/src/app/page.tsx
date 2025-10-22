"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaUtensils, FaPaperPlane, FaArrowRight, FaImage, FaForward, FaSignOutAlt } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function Home() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<"preferences" | "chat">("preferences");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Preferences form state
  const [preferences, setPreferences] = useState({
    region: "",
    taste_preferences: [] as string[],
    meal_type: "",
    time_available: "",
    allergies: [] as string[],
    dislikes: [] as string[],
    available_ingredients: [] as string[],
  });

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; image?: string }>>([]);
  const [currentRecipe, setCurrentRecipe] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // Handle preference submission
  const handleSubmitPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session_id);
        setMessages([
          { role: "assistant", content: "Here are your top 3 recipe recommendations:\n\n" + data.recommendations }
        ]);
        setStep("chat");
      }
    } catch (error) {
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // Handle recipe selection
  const selectRecipe = async (recipeName: string) => {
    setLoading(true);
    setCurrentRecipe(recipeName);
    
    try {
      const response = await fetch(`http://localhost:8000/api/recipe/details?session_id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_name: recipeName }),
      });
      const data = await response.json();
      
      if (data.success) {
        setTotalSteps(data.steps.length);
        setMessages(prev => [...prev, 
          { role: "user", content: `Show me how to make ${recipeName}` },
          { role: "assistant", content: `Great choice! Let's cook ${recipeName}.\n\n**Ingredients:**\n${data.ingredients}\n\n**Tips:**\n${data.tips}\n\nClick "Next Step" to start cooking!` }
        ]);
      }
    } catch (error) {
      alert("Error getting recipe details");
    } finally {
      setLoading(false);
    }
  };

  // Next Step
  const handleNextStep = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/step/next?session_id=${sessionId}`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.completed) {
        setMessages(prev => [...prev, { role: "assistant", content: "🎉 Congratulations! You've completed all steps!\n\n" + data.tips }]);
      } else {
        setCurrentStep(data.step_number);
        setMessages(prev => [...prev, { role: "assistant", content: `**Step ${data.step_number}/${data.total_steps}:**\n${data.step}` }]);
      }
    } catch (error) {
      alert("Error getting next step");
    } finally {
      setLoading(false);
    }
  };

  // Generate Image
  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/step/image?session_id=${sessionId}`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        const imageUrl = data.image_data ? `data:image/png;base64,${data.image_data}` : "";
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `**Visual Guide:**\n${data.description}`,
          image: imageUrl 
        }]);
      }
    } catch (error) {
      alert("Error generating image");
    } finally {
      setLoading(false);
    }
  };

  // Skip
  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/api/step/skip?session_id=${sessionId}`, {
        method: "POST",
      });
      setMessages(prev => [...prev, { role: "assistant", content: "Skipped remaining steps. You can ask for ingredient alternatives if needed!" }]);
    } catch (error) {
      alert("Error skipping");
    } finally {
      setLoading(false);
    }
  };

  const regions = ["Indian", "Chinese", "Italian", "Mexican", "Japanese"];
  const tastes = ["Sweet", "Spicy", "Savory", "Sour", "Tangy"];
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const times = ["15-30 mins", "30-45 mins", "45-60 mins", "1+ hour"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaUtensils className="text-white text-3xl" />
              <h1 className="text-3xl font-bold text-white">Foodiee</h1>
            </div>
            
            {/* User Info & Sign Out */}
            {session?.user && (
              <div className="flex items-center gap-4">
                <div className="text-white text-right">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-sm text-orange-100">{session.user.email}</p>
                </div>
                {session.user.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="bg-white text-orange-500 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition flex items-center gap-2"
                >
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Authentication Gate */}
        {status === "loading" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-orange-500"></span>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <FaUtensils className="text-orange-500 text-6xl mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Foodiee</h2>
                <p className="text-gray-600">Your personal AI cooking assistant</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700">Sign in to get personalized recipe recommendations and step-by-step cooking guidance</p>
                
                <button
                  onClick={() => signIn("google")}
                  className="w-full bg-white border-2 border-gray-300 hover:border-orange-500 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 hover:shadow-lg"
                >
                  <FcGoogle className="text-2xl" />
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>✨ Get AI-powered recipe suggestions</p>
                <p>👨‍🍳 Step-by-step cooking instructions</p>
                <p>🖼️ Visual guides for each step</p>
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES FORM */}
        {status === "authenticated" && step === "preferences" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Tell us your preferences</h2>
            
            <div className="space-y-4">
              {/* Region */}
              <div>
                <label className="block font-medium mb-2">Cuisine</label>
                <select 
                title="Your chat...."
                  className="w-full p-3 border rounded-lg"
                  value={preferences.region}
                  onChange={(e) => setPreferences({...preferences, region: e.target.value})}
                >
                  <option value="">Select...</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Taste */}
              <div>
                <label className="block font-medium mb-2">Tastes</label>
                <div className="flex flex-wrap gap-2">
                  {tastes.map(taste => (
                    <button
                      key={taste}
                      type="button"
                      onClick={() => {
                        const newTastes = preferences.taste_preferences.includes(taste)
                          ? preferences.taste_preferences.filter(t => t !== taste)
                          : [...preferences.taste_preferences, taste];
                        setPreferences({...preferences, taste_preferences: newTastes});
                      }}
                      className={`px-4 py-2 rounded-full ${
                        preferences.taste_preferences.includes(taste)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {taste}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Type */}
              <div>
                <label className="block font-medium mb-2">Meal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {mealTypes.map(meal => (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => setPreferences({...preferences, meal_type: meal})}
                      className={`p-3 rounded-lg ${
                        preferences.meal_type === meal
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block font-medium mb-2">Time Available</label>
                <div className="grid grid-cols-2 gap-2">
                  {times.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPreferences({...preferences, time_available: time})}
                      className={`p-3 rounded-lg ${
                        preferences.time_available === time
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block font-medium mb-2">Available Ingredients (comma separated)</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  placeholder="e.g., tomatoes, onions, chicken"
                  onBlur={(e) => {
                    const ingredients = e.target.value.split(',').map(i => i.trim()).filter(i => i);
                    setPreferences({...preferences, available_ingredients: ingredients});
                  }}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitPreferences}
                disabled={loading || !preferences.region || preferences.taste_preferences.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="loading loading-spinner"></span> : <><FaPaperPlane /> Find Recipes</>}
              </button>
            </div>
          </div>
        )}

        {/* CHAT INTERFACE */}
        {status === "authenticated" && step === "chat" && (
          <div className="max-w-4xl mx-auto">
            {/* Messages */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 h-[600px] overflow-y-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.image && (
                      <img src={msg.image} alt="Step" className="mt-3 rounded-lg max-w-full" />
                    )}
                  </div>
                  
                  {/* Show recipe selection buttons after first message */}
                  {idx === 0 && msg.role === "assistant" && !currentRecipe && (
                    <div className="mt-4 space-y-2 text-left">
                      <p className="text-sm text-gray-600 mb-2">Select a recipe to start:</p>
                      {["Recipe 1", "Recipe 2", "Recipe 3"].map((recipe, i) => (
                        <button
                          key={i}
                          onClick={() => selectRecipe(recipe)}
                          className="block w-full text-left bg-orange-100 hover:bg-orange-200 p-3 rounded-lg transition"
                        >
                          Select {recipe}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="text-center py-4">
                  <span className="loading loading-spinner loading-lg text-orange-500"></span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {currentRecipe && (
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleNextStep}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <FaArrowRight /> Next Step
                  </button>
                  
                  <button
                    onClick={handleGenerateImage}
                    disabled={loading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <FaImage /> Generate Image
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <FaForward /> Skip
                  </button>
                </div>
                
                {currentStep > 0 && (
                  <div className="mt-3 text-center text-sm text-gray-600">
                    Step {currentStep} of {totalSteps}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
