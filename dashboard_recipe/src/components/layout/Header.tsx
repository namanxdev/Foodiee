"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import {
  ChefHat,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
} from "lucide-react";

import VegetarianToggle from "@/components/VegetarianToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  session: Session | null;
}

const ADMIN_EMAILS = [
  "ranjithkalingeri@oldowaninnovations.com",
  // Extend as needed.
];

type NavLink = {
  href: string;
  label: string;
  requiresAuth?: boolean;
};

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: NavLink[] = useMemo(
    () => [
      { href: "/", label: "Discover" },
      { href: "/library", label: "Recipe Library" },
      { href: "/preferences", label: "Personalize" },
      { href: "/history", label: "Cooked History", requiresAuth: true },
    ],
    []
  );

  useEffect(() => {
    if (session?.user?.email) {
      setIsAdmin(ADMIN_EMAILS.includes(session.user.email));
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  const greeting =
    session?.user?.name?.split(" ")?.[0] ?? "Guest";

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100/40 bg-white/80 backdrop-blur dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-foreground">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand-glow">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              Foodiee Kitchen
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-orange-500">
              AI Recipe Studio
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks
            .filter((link) => !link.requiresAuth || session?.user)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                  pathname === link.href
                    ? "bg-brand-gradient text-white shadow-brand ring-2 ring-orange-400/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-300"
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <BadgeGreeting greeting={greeting} />
          <ThemeToggle />
          <VegetarianToggle variant="navbar" />
          {session?.user ? (
            <>
              {isAdmin && (
                <Button
                  asChild
                  variant="secondary"
                  className="rounded-full border border-purple-200/80 bg-purple-50/80 text-purple-700 hover:bg-purple-100"
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-orange-100 shadow-sm">
                  <AvatarImage
                    src={session.user.image ?? ""}
                    alt={session.user.name ?? "User avatar"}
                  />
                  <AvatarFallback>
                    {session.user.name
                      ?.split(" ")
                      .map((part) => part.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "FK"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  className="rounded-full border-orange-200/70 bg-white/70 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="gradient"
              className="rounded-full px-6"
              onClick={() => signIn("google")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start cooking smarter
            </Button>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border border-orange-100/60 bg-white/70 text-slate-700 shadow-sm"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BadgeGreeting greeting={greeting} />
          <ThemeToggle className="md:hidden" />
          {session?.user ? (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-orange-100/80 text-orange-700"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              className="rounded-full px-4"
              onClick={() => signIn("google")}
            >
              Join
            </Button>
          )}
        </div>

        {menuOpen && (
          <MobileMenu
            navLinks={navLinks}
            pathname={pathname}
            session={session}
            isAdmin={isAdmin}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}

function BadgeGreeting({ greeting }: { greeting: string }) {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-orange-100/70 bg-orange-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-500 md:inline-flex">
      <UserRound className="h-4 w-4" />
      {greeting}
    </span>
  );
}

function MobileMenu({
  navLinks,
  pathname,
  session,
  isAdmin,
  onClose,
}: {
  navLinks: NavLink[];
  pathname: string | null;
  session: Session | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-3xl border border-orange-100/70 bg-white/90 p-4 shadow-xl shadow-brand/20">
      <nav className="flex flex-col gap-2">
        {navLinks
          .filter((link) => !link.requiresAuth || session?.user)
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-300",
                pathname === link.href
                  ? "bg-brand-gradient text-white ring-2 ring-orange-400/50 scale-105"
                  : "bg-white text-slate-600 hover:bg-orange-50"
              )}
            >
              {link.label}
            </Link>
          ))}
      </nav>
      <div className="flex flex-col gap-3">
        <VegetarianToggle variant="navbar" />
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="rounded-2xl border border-purple-200/80 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 shadow-sm"
          >
            Admin dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
