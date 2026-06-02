export function AdminActivityFeed({
  activity,
}: {
  activity: { id: string; action: string; entity: string; meta: string; time: string }[];
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <h2 className="text-xl font-semibold text-white">Atividade recente</h2>
      <div className="mt-5 space-y-4">
        {activity.map((item) => (
          <div className="grid grid-cols-[10px_1fr] gap-3" key={item.id}>
            <span className="mt-1.5 size-2.5 rounded-full bg-cinema-cyan shadow-[0_0_18px_rgba(19,200,255,.7)]" />
            <div>
              <p className="text-sm font-semibold text-white">{item.action}</p>
              <p className="mt-1 text-xs text-cinema-muted">{item.entity} / {item.meta} / {item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
