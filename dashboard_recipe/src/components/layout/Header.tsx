"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { FaUtensils, FaSignOutAlt, FaCog } from "react-icons/fa";
import Link from "next/link";
import { useState, useEffect } from "react";
import VegetarianToggle from "@/components/VegetarianToggle";

interface HeaderProps {
  session: Session | null;
}

// Whitelist of admin emails (matches backend)
const ADMIN_EMAILS = [
  'ranjithkalingeri@oldowaninnovations.com',
  // Add more admin emails here
];

export default function Header({ session }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (session?.user?.email) {
      setIsAdmin(ADMIN_EMAILS.includes(session.user.email));
    }
  }, [session]);

  return (
    <header className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <FaUtensils className="text-white text-3xl" />
              <h1 className="text-3xl font-bold text-white">Foodiee</h1>
            </Link>
          </div>

          {/* Navigation Links & Vegetarian Toggle */}
          {session?.user && (
            <div className="flex items-center gap-3">
              <Link
                href="/preferences"
                className="text-white hover:text-orange-100 px-3 py-2 rounded-lg font-medium transition hover:bg-white/20"
              >
                Preferences
              </Link>
              <Link
                href="/top-recipes"
                className="text-white hover:text-orange-100 px-3 py-2 rounded-lg font-medium transition hover:bg-white/20"
              >
                Top Recipes
              </Link>
              <Link
                href="/history"
                className="text-white hover:text-orange-100 px-3 py-2 rounded-lg font-medium transition hover:bg-white/20"
              >
                History
              </Link>
              <VegetarianToggle variant="navbar" />
            </div>
          )}
          
          {/* User Info & Sign Out */}
          {session?.user && (
            <div className="flex items-center gap-4">
              {/* Admin Link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                  title="Admin Dashboard"
                >
                  <FaCog /> <span className="hidden sm:inline">Admin</span>
                  <span className="sm:hidden">⚙️</span>
                </Link>
              )}

              <div className="text-white text-right hidden sm:block">
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
                <FaSignOutAlt className="sm:hidden" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
