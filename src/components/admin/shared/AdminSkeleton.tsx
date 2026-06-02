import { Skeleton } from "@/components/ui/Skeleton";

export function AdminSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-32 rounded-xl" key={index} />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
