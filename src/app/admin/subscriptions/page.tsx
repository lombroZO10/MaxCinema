import { ContentStatusBadge } from "@/components/admin/shared/ContentStatusBadge";

const rows = [
  { plan: "Premium 4K", provider: "Stripe", status: "active", renewal: "futuro" },
  { plan: "Cinema Family", provider: "Mercado Pago", status: "trialing", renewal: "futuro" },
  { plan: "Mobile", provider: "Stripe", status: "past_due", renewal: "futuro" },
];

export default function AdminSubscriptionsPage() {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <h1 className="text-3xl font-semibold text-white">Assinaturas</h1>
      <p className="mt-2 text-sm text-cinema-muted">Superficie preparada para Stripe e Mercado Pago.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <article className="rounded-lg border border-white/10 bg-black/18 p-4" key={row.plan}>
            <p className="text-lg font-semibold text-white">{row.plan}</p>
            <p className="mt-1 text-sm text-cinema-muted">{row.provider}</p>
            <div className="mt-4">
              <ContentStatusBadge status={row.status} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
