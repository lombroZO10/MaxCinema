"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useActiveProfile } from "@/hooks/use-active-profile";

type ActiveProfileContextValue = ReturnType<typeof useActiveProfile>;

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(null);

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const value = useActiveProfile();
  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>;
}

export function useActiveProfileContext() {
  const value = useContext(ActiveProfileContext);
  if (!value) throw new Error("useActiveProfileContext must be used inside ActiveProfileProvider");
  return value;
}
