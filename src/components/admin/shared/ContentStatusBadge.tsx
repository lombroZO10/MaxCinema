import { cn } from "@/utils/cn";

export function ContentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        normalized === "published" || normalized === "active"
          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
          : normalized === "draft" || normalized === "trialing"
            ? "border-cinema-amber/30 bg-cinema-amber/10 text-cinema-amber"
            : "border-white/15 bg-white/7 text-white/70",
      )}
    >
      {status}
    </span>
  );
}
