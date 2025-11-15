"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CinematicNavProps {
  status: "authenticated" | "loading" | "unauthenticated";
}

export function CinematicNav({ status }: CinematicNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-4 z-40">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-black/60 px-8 py-3 text-white backdrop-blur-2xl sm:px-10 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5A2F] to-[#FFD07F] text-[#1E1E1E] shadow-[0_12px_30px_-15px_rgba(255,90,47,0.7)] transition-transform duration-300 group-hover:scale-110">
            <ChefHat className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="text-sm">
            <p className="font-semibold tracking-wide text-white group-hover:text-[#FFD07F] transition-colors">
              Foodiee
            </p>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Cinematic Sous Chef
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-xs uppercase tracking-[0.4em] text-white/70 md:flex">
          <Link 
            href="/preferences" 
            className={cn(
              "transition-all duration-300 px-4 py-2 rounded-full",
              pathname === "/preferences"
                ? "bg-[#FFD07F]/20 text-[#FFD07F] border border-[#FFD07F]/40 shadow-[0_0_15px_rgba(255,208,127,0.3)]"
                : "text-white/70 hover:text-[#FFD07F]"
            )}
          >
            Preferences
          </Link>
          <Link 
            href="/history" 
            className={cn(
              "transition-all duration-300 px-4 py-2 rounded-full",
              pathname === "/history"
                ? "bg-[#FFD07F]/20 text-[#FFD07F] border border-[#FFD07F]/40 shadow-[0_0_15px_rgba(255,208,127,0.3)]"
                : "text-white/70 hover:text-[#FFD07F]"
            )}
          >
            History
          </Link>
          <Link 
            href="/top-recipes" 
            className={cn(
              "transition-all duration-300 px-4 py-2 rounded-full",
              pathname === "/top-recipes"
                ? "bg-[#FFD07F]/20 text-[#FFD07F] border border-[#FFD07F]/40 shadow-[0_0_15px_rgba(255,208,127,0.3)]"
                : "text-white/70 hover:text-[#FFD07F]"
            )}
          >
            Top Recipes
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {status === "authenticated" && session?.user ? (
            <>
              {/* Desktop Dropdown */}
              <div className="hidden items-center gap-3 md:flex">
                <DropdownMenu
                  trigger={
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-10 w-10 border border-white/20 shadow-sm">
                        <AvatarImage
                          src={session.user.image ?? ""}
                          alt={session.user.name ?? "User avatar"}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <AvatarFallback className="bg-white/10 text-white">
                          {session.user.name
                            ?.split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {session.user.name?.split(" ")[0] || session.user.email?.split("@")[0] || "User"}
                        </span>
                        {session.user.email && (
                          <span className="text-[10px] text-white/60">{session.user.email}</span>
                        )}
                      </div>
                    </div>
                  }
                  align="end"
                >
                  <DropdownMenuItem>
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <DropdownMenu
                  trigger={
                    <Avatar className="h-10 w-10 border border-white/20 shadow-sm cursor-pointer">
                      <AvatarImage
                        src={session.user.image ?? ""}
                        alt={session.user.name ?? "User avatar"}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                      <AvatarFallback className="bg-white/10 text-white">
                        {session.user.name
                          ?.split(" ")
                          .map((part) => part.charAt(0))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  }
                  align="end"
                >
                  <DropdownMenuItem>
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="hidden rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/75 transition hover:border-[#FFD07F]/60 hover:text-[#FFD07F] md:inline-flex"
            >
              Sign in
            </button>
          )}
          <GlowingButton label="Cook with AI Magic" href="/preferences" className="px-6 py-2 text-xs" />
        </div>
      </nav>
    </header>
  );
}

