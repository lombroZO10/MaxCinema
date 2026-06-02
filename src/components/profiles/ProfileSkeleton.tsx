export function ProfileSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="aspect-square rounded-[1.25rem] bg-white/8" />
      <div className="mt-4 h-5 w-2/3 rounded bg-white/8" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/6" />
    </div>
  );
}
