import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="cinema-bg min-h-screen px-5 pt-28 md:px-10">
      <Skeleton className="h-[420px] w-full rounded-xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="aspect-[2/3]" key={index} />
        ))}
      </div>
    </main>
  );
}
