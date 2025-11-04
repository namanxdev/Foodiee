"use client";

import { useEffect, useState } from "react";

const ImageGeneratingAnimation = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const cookingTips = [
    "🎨 Creating your visual masterpiece...",
    "👨‍🍳 Adding the perfect garnish...",
    "✨ Plating with precision...",
    "🔥 Getting the perfect sear...",
    "🌟 Making it picture-perfect...",
    "🎯 Capturing the aroma visually...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % cookingTips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Main Animation Container */}
      <div className="relative w-64 h-64 mb-6">
        {/* Cooking Pot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pot Body */}
            <div className="w-40 h-32 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-3xl relative overflow-hidden shadow-2xl">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
              
              {/* Bubbling water effect */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-400/30 to-transparent">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 w-3 h-3 bg-white/40 rounded-full animate-bubble"
                    style={{
                      left: `${15 + i * 15}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: `${2 + Math.random()}s`
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Pot Lid */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-44 h-10 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-3xl shadow-xl animate-lid-bounce">
              {/* Lid Handle */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-6 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-full" />
            </div>
            
            {/* Steam */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 opacity-60 animate-steam"
                  style={{
                    animationDelay: `${i * 0.4}s`
                  }}
                >
                  <div className="w-full h-12 bg-gradient-to-t from-gray-400 to-transparent blur-sm rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Ingredients */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Tomato */}
          <div className="absolute top-8 left-8 text-4xl animate-float" style={{ animationDelay: '0s' }}>
            🍅
          </div>
          {/* Onion */}
          <div className="absolute top-12 right-12 text-3xl animate-float" style={{ animationDelay: '0.5s' }}>
            🧅
          </div>
          {/* Carrot */}
          <div className="absolute bottom-16 left-12 text-3xl animate-float" style={{ animationDelay: '1s' }}>
            🥕
          </div>
          {/* Pepper */}
          <div className="absolute bottom-20 right-16 text-3xl animate-float" style={{ animationDelay: '1.5s' }}>
            🌶️
          </div>
        </div>

        {/* Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-400 animate-sparkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                fontSize: `${12 + Math.random() * 8}px`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
          Generating Your Recipe Image
        </h3>
        
        {/* Rotating Tips */}
        <p className="text-sm text-gray-600 dark:text-gray-400 h-6 transition-all duration-500 animate-fade-in">
          {cookingTips[currentTip]}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pt-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Custom Animations Styles */}
      <style jsx>{`
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-80px) scale(1);
            opacity: 0;
          }
        }

        @keyframes steam {
          0% {
            transform: translateY(0) scaleX(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scaleX(1.5);
            opacity: 0;
          }
        }

        @keyframes lid-bounce {
          0%, 100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -8px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-bubble {
          animation: bubble 2.5s ease-in-out infinite;
        }

        .animate-steam {
          animation: steam 2s ease-out infinite;
        }

        .animate-lid-bounce {
          animation: lid-bounce 1.5s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImageGeneratingAnimation;

