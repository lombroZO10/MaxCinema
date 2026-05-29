import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass rounded-xl", className)}>{children}</div>;
}
