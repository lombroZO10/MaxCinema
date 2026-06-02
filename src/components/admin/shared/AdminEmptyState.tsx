import { Radar } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminEmptyState({ title, description, href }: { title: string; description: string; href?: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-white/10 bg-white/[0.035] p-8 text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-cinema-cyan/30 bg-cinema-cyan/10 text-cinema-cyan">
          <Radar size={24} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cinema-muted">{description}</p>
        {href ? (
          <Button className="mt-6" href={href}>
            Criar agora
          </Button>
        ) : null}
      </div>
    </div>
  );
}
