"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

export function DropdownMenu({ children, trigger, align = "end", className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const alignClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 min-w-[200px] rounded-lg border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl py-2",
            alignClasses[align],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  asChild,
}: DropdownMenuItemProps) {
  if (asChild) {
    return <>{children}</>;
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("h-px bg-white/10 my-1", className)} />
  );
}

