"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

export function PremiumRowCarousel({
  title,
  subtitle,
  badge,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = row.scrollWidth - row.clientWidth;
    const overflow = maxScrollLeft > 6;

    setHasOverflow(overflow);
    setCanScrollLeft(row.scrollLeft > 6);
    setCanScrollRight(overflow && row.scrollLeft < maxScrollLeft - 6);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    updateScrollState();

    const onScroll = () => window.requestAnimationFrame(updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);

    row.addEventListener("scroll", onScroll, { passive: true });
    resizeObserver.observe(row);
    window.addEventListener("resize", updateScrollState);

    return () => {
      row.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByPage = (direction: "left" | "right") => {
    const row = rowRef.current;
    if (!row) return;

    const distance = Math.floor(row.clientWidth * 0.72);
    row.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  return (
    <section className={cn("group/row relative", className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 lg:mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.015em] text-white md:text-2xl lg:text-[1.7rem]">{title}</h2>
          {subtitle ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-cinema-muted lg:text-[15px]">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full border border-white/12 bg-white/[0.055] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/62">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="relative">
        {hasOverflow && canScrollLeft ? (
          <div className="pointer-events-none absolute bottom-3 left-0 top-3 z-10 hidden w-20 bg-gradient-to-r from-[#030609] via-[#030609]/78 to-transparent lg:block" />
        ) : null}
        {hasOverflow && canScrollRight ? (
          <div className="pointer-events-none absolute bottom-3 right-0 top-3 z-10 hidden w-20 bg-gradient-to-l from-[#030609] via-[#030609]/78 to-transparent lg:block" />
        ) : null}

        {hasOverflow && canScrollLeft ? (
          <button
            aria-label={`Voltar em ${title}`}
            className="absolute left-2 top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/14 bg-black/46 text-white/82 opacity-0 shadow-[0_18px_55px_rgba(0,0,0,.42)] outline-none backdrop-blur-xl transition duration-300 hover:border-white/26 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cinema-cyan/55 group-hover/row:opacity-100 lg:grid"
            onClick={() => scrollByPage("left")}
            type="button"
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>
        ) : null}

        {hasOverflow && canScrollRight ? (
          <button
            aria-label={`Avancar em ${title}`}
            className="absolute right-2 top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/14 bg-black/46 text-white/82 opacity-0 shadow-[0_18px_55px_rgba(0,0,0,.42)] outline-none backdrop-blur-xl transition duration-300 hover:border-white/26 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cinema-cyan/55 group-hover/row:opacity-100 lg:grid"
            onClick={() => scrollByPage("right")}
            type="button"
          >
            <ChevronRight size={24} strokeWidth={1.8} />
          </button>
        ) : null}

        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-0 py-3 pr-8 lg:gap-5 lg:py-4 xl:gap-5 2xl:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={rowRef}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
