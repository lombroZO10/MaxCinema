"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import type { Collection } from "@/types/domain";

export function CollectionCard({ collection, className }: { collection: Collection; className?: string }) {
  const cover =
    collection.coverUrl ||
    collection.bannerUrl ||
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&h=900&q=86";

  return (
    <Link
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-white/6 shadow-[0_18px_60px_rgba(0,0,0,0.36)] transition duration-500 hover:border-white/20 hover:bg-white/[0.08]",
        className,
      )}
      href={`/browse/collections/${collection.slug}`}
      style={{ boxShadow: `0 18px 60px rgba(0,0,0,.36), 0 0 0 1px ${collection.accentColor}20` }}
    >
      <div className="relative aspect-[16/9]">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-92 transition duration-700 group-hover:scale-105" src={cover} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,9,.1)_0%,rgba(3,6,9,.28)_40%,rgba(3,6,9,.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_28%,transparent_0%,rgba(0,0,0,.2)_58%,rgba(0,0,0,.62)_100%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/14 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/82 backdrop-blur">
          <span className="size-2 rounded-full" style={{ backgroundColor: collection.accentColor }} />
          {collection.type.replace(/_/g, " ")}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-semibold text-white md:text-2xl">{collection.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">{collection.shortDescription || collection.description}</p>
        </div>
      </div>
    </Link>
  );
}

