"use client";

import { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaImage, FaCheckCircle, FaQuestionCircle } from "react-icons/fa";
import MarkdownRenderer from "./MarkdownRenderer";

interface CookingStepsProps {
  sessionId: string;
  recipeName: string;
  steps: string[];
  onFinish: () => void;
  onBack: () => void;
}

export default function CookingSteps({ sessionId, recipeName, steps, onFinish, onBack }: CookingStepsProps) {
  const [currentStepData, setCurrentStepData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageData, setImageData] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [missingIngredient, setMissingIngredient] = useState("");
  const [alternatives, setAlternatives] = useState("");

  const loadNextStep = async () => {
    setLoading(true);
    setImageData(null);

    try {
      const response = await fetch(`http://localhost:8000/api/step/next?session_id=${sessionId}`, {
        method: "POST",
      });

      const data = await response.json();
      setCurrentStepData(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load next step");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    setImageLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/step/gemini_image?session_id=${sessionId}`, {
        method: "POST",
      });

      const data = await response.json();
      setImageData(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate image");
    } finally {
      setImageLoading(false);
    }
  };

  const getAlternatives = async () => {
    if (!missingIngredient.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/ingredients/alternatives?session_id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missing_ingredient: missingIngredient,
          recipe_context: recipeName,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAlternatives(data.alternatives);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get alternatives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextStep();
  }, []);

  if (!currentStepData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-orange-500"></span>
      </div>
    );
  }

  if (currentStepData.completed) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-gradient-to-br from-green-100 to-emerald-100 shadow-2xl">
          <div className="card-body items-center text-center p-12">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="card-title text-4xl mb-4 text-green-700">Congratulations!</h2>
            <p className="text-xl text-black dark:text-gray-200 mb-6">You've completed all the cooking steps!</p>
            
            {currentStepData.tips && (
              <div className="mt-6 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
                <h4 className="font-bold mb-2 text-amber-700 dark:text-amber-300">💡 Chef's Tips:</h4>
                <MarkdownRenderer content={currentStepData.tips} />
              </div>
            )}

            {/* Ingredient Alternatives Section */}
            <div className="w-full max-w-2xl mt-8">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="btn bg-gradient-to-r from-blue-500 to-purple-500 text-white w-full hover:from-blue-600 hover:to-purple-600 mb-4"
              >
                <FaQuestionCircle />
                Need Ingredient Alternatives?
              </button>

              {showAlternatives && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-black dark:text-white">Missing Ingredient:</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., eggs, milk, butter..."
                        className="input input-bordered flex-1"
                        value={missingIngredient}
                        onChange={(e) => setMissingIngredient(e.target.value)}
                      />
                      <button
                        onClick={getAlternatives}
                        disabled={loading || !missingIngredient.trim()}
                        className="btn bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      >
                        {loading ? <span className="loading loading-spinner"></span> : "Get Alternatives"}
                      </button>
                    </div>
                  </div>

                  {alternatives && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                      <h4 className="font-bold mb-2 text-orange-700">Alternatives:</h4>
                      <MarkdownRenderer content={alternatives} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onFinish}
              className="btn btn-lg bg-gradient-to-r from-green-500 to-teal-500 text-white border-none hover:from-green-600 hover:to-teal-600 mt-8 px-12"
            >
              Start New Recipe 🍳
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="btn btn-ghost mb-6 hover:bg-orange-100 transition-all group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Details
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Step Card */}
        <div className="card bg-gradient-to-br from-white to-blue-50 shadow-2xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-blue-700">
                Step {currentStepData.step_number} of {currentStepData.total_steps}
              </h3>
              <div className="badge badge-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                {Math.round((currentStepData.step_number / currentStepData.total_steps) * 100)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(currentStepData.step_number / currentStepData.total_steps) * 100}%` } as React.CSSProperties}
              ></div>
            </div>

            {/* Current Step */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6">
              <p className="text-lg text-black dark:text-gray-200 leading-relaxed">{currentStepData.step}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={generateImage}
                disabled={imageLoading}
                className="btn btn-lg w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all"
              >
                {imageLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <FaImage /> Generate Visual Guide
                  </>
                )}
              </button>

              <button
                onClick={loadNextStep}
                disabled={loading}
                className="btn btn-lg w-full bg-gradient-to-r from-green-500 to-teal-500 text-white border-none hover:from-green-600 hover:to-teal-600 shadow-lg transform hover:scale-105 transition-all group"
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    Next Step
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Image Card */}
        <div className="card bg-gradient-to-br from-white to-purple-50 shadow-2xl">
          <div className="card-body items-center justify-center">
            {!imageData && !imageLoading && (
              <div className="text-center py-12">
                <FaImage className="text-8xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Click "Generate Visual Guide" to see an image</p>
              </div>
            )}

            {imageLoading && (
              <div className="text-center py-12">
                <span className="loading loading-spinner loading-lg text-purple-500"></span>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Generating image...</p>
              </div>
            )}

            {imageData && (
              <div className="w-full">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-2xl mb-4">
                  {imageData.image_data ? (
                    <img
                      src={`data:image/png;base64,${imageData.image_data}`}
                      alt="Step visualization"
                      className="w-full rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl">
                      <div className="text-6xl text-center mb-4">🎨</div>
                      <p className="text-gray-600 dark:text-gray-400 text-center text-sm">(GPU not available - showing description)</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                  <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2">Image Description:</h4>
                  <p className="text-black dark:text-gray-200 text-sm leading-relaxed">{imageData.description}</p>
                  <div className="badge badge-sm bg-purple-100 text-purple-700 mt-2">
                    {imageData.generation_type === "gpu" ? "🎮 GPU Generated" : "📝 Text Only"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
