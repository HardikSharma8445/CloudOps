"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type FilterContextType = {
  selectedAccountId: string | "all";
  setSelectedAccountId: (id: string | "all") => void;
  selectedRegion: string | "all";
  setSelectedRegion: (region: string | "all") => void;
};

const FilterContext = createContext<FilterContextType | null>(null);

const STORAGE_KEY_ACCOUNT = "cloudops-selected-account";
const STORAGE_KEY_REGION = "cloudops-selected-region";

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | "all">("all");
  const [selectedRegion, setSelectedRegionState] = useState<string | "all">("all");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAccount = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    const savedRegion = localStorage.getItem(STORAGE_KEY_REGION);
    
    if (savedAccount) {
      setSelectedAccountIdState(savedAccount as string | "all");
    }
    if (savedRegion) {
      setSelectedRegionState(savedRegion as string | "all");
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when changed
  const setSelectedAccountId = (id: string | "all") => {
    setSelectedAccountIdState(id);
    localStorage.setItem(STORAGE_KEY_ACCOUNT, id);
  };

  const setSelectedRegion = (region: string | "all") => {
    setSelectedRegionState(region);
    localStorage.setItem(STORAGE_KEY_REGION, region);
  };

  // Always render children immediately with default values until hydrated
  // This prevents blocking the initial page render while localStorage loads

  return (
    <FilterContext.Provider
      value={{
        selectedAccountId: isHydrated ? selectedAccountId : "all",
        setSelectedAccountId,
        selectedRegion: isHydrated ? selectedRegion : "all", 
        setSelectedRegion,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
