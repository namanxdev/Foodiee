"use client";

import { useSession } from "next-auth/react";
import { HeroCinematic } from "@/components/sections/HeroCinematic";
import { TasteIntelligence } from "@/components/sections/TasteIntelligence";
import { StepShowcase } from "@/components/sections/StepShowcase";
import { ChefGallery } from "@/components/sections/ChefGallery";
import { CinematicNav } from "@/components/layout/CinematicNav";
import { CinematicFooter } from "@/components/layout/CinematicFooter";

export default function Home() {
  const { status } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <CinematicNav status={status} />

      <main className="flex flex-1 flex-col gap-12 pb-24 pt-28 sm:pt-32">
        <HeroCinematic />
        <div className="relative bg-black">
          <div id="taste">
            <TasteIntelligence />
          </div>
          <div id="steps">
            <StepShowcase />
          </div>
          <div id="gallery">
            <ChefGallery />
          </div>
        </div>
      </main>

      <div className="bg-black px-6 pb-16 pt-10 sm:px-10 md:px-12 lg:px-16">
        <CinematicFooter />
      </div>
    </div>
  );
}
