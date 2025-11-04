"use client";

import { signIn } from "next-auth/react";
import { FaUtensils } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import LoadingSpinner from "../LoadingSpinner";

interface AuthGateProps {
  status: "loading" | "authenticated" | "unauthenticated";
  children: React.ReactNode;
}

export default function AuthGate({ status, children }: AuthGateProps) {
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <FaUtensils className="text-orange-500 text-6xl mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Foodiee</h2>
            <p className="text-gray-600">Your personal AI cooking assistant</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Sign in to get personalized recipe recommendations and step-by-step cooking guidance
            </p>
            
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
    );
  }

  return <>{children}</>;
}
