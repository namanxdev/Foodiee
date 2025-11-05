"use client";

import { SessionProvider } from "next-auth/react";
import { VegetarianProvider } from "@/contexts/VegetarianContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <VegetarianProvider>{children}</VegetarianProvider>
    </SessionProvider>
  );
}
