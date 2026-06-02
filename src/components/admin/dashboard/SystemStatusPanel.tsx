import { ContentStatusBadge } from "@/components/admin/shared/ContentStatusBadge";

export function SystemStatusPanel({ items }: { items: { label: string; value: string; tone: string }[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <h2 className="text-xl font-semibold text-white">Status do sistema</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-black/18 px-4 py-3" key={item.label}>
            <span className="text-sm text-white/68">{item.label}</span>
            <ContentStatusBadge status={item.value} />
          </div>
        ))}
      </div>
    </section>
  );
}
