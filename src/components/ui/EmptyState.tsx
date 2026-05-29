import { Film } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionHref = "/browse",
}: {
  title: string;
  description: string;
  actionHref?: string;
}) {
  return (
    <div className="glass mx-auto flex max-w-xl flex-col items-center rounded-xl px-8 py-14 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-full border border-cinema-cyan/30 bg-cinema-cyan/10 text-cinema-cyan">
        <Film size={24} />
      </div>
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-cinema-muted">{description}</p>
      <Button className="mt-7" href={actionHref}>
        Explorar catalogo
      </Button>
    </div>
  );
}
