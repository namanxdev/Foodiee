"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface VegetarianContextType {
  isVegetarian: boolean;
  toggleVegetarian: () => void;
  setVegetarian: (value: boolean) => void;
}

const VegetarianContext = createContext<VegetarianContextType | undefined>(undefined);

export function VegetarianProvider({ children }: { children: ReactNode }) {
  const [isVegetarian, setIsVegetarian] = useState(false);

  const toggleVegetarian = () => {
    setIsVegetarian((prev) => !prev);
  };

  const setVegetarian = (value: boolean) => {
    setIsVegetarian(value);
  };

  return (
    <VegetarianContext.Provider value={{ isVegetarian, toggleVegetarian, setVegetarian }}>
      {children}
    </VegetarianContext.Provider>
  );
}

export function useVegetarian() {
  const context = useContext(VegetarianContext);
  if (context === undefined) {
    throw new Error("useVegetarian must be used within a VegetarianProvider");
  }
  return context;
}


