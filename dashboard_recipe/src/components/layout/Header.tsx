"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { FaUtensils, FaSignOutAlt, FaCog } from "react-icons/fa";
import Link from "next/link";
import { useState, useEffect } from "react";

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
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <FaUtensils className="text-white text-3xl" />
              <h1 className="text-3xl font-bold text-white">Foodiee</h1>
            </Link>
          </div>
          
          {/* User Info & Sign Out */}
          {session?.user && (
            <div className="flex items-center gap-4">
              {/* Admin Links */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/image-generation"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                    title="Image Generation Admin"
                  >
                    <FaCog /> Image Admin
                  </Link>
                  <Link
                    href="/admin/recipe-admin"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                    title="Recipe Admin"
                  >
                    🍳 Recipe Admin
                  </Link>
                </div>
              )}

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
  );
}
