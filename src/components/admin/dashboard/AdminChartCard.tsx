export function AdminChartCard() {
  const bars = [62, 84, 58, 91, 74, 96, 67, 88, 78, 93, 72, 86];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-cinema-cyan">Analytics</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Consumo em tempo real</h2>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Online
        </span>
      </div>
      <div className="mt-8 flex h-56 items-end gap-3">
        {bars.map((height, index) => (
          <div className="flex flex-1 flex-col items-center gap-3" key={index}>
            <div className="relative w-full overflow-hidden rounded-t-md bg-white/7" style={{ height: 180 }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-cinema-cyan to-cinema-amber shadow-[0_0_32px_rgba(19,200,255,.22)]"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[10px] text-white/38">{index + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
