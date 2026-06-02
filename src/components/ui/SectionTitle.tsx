export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 lg:mb-6">
      <h2 className="text-xl font-semibold tracking-[-0.015em] text-white md:text-2xl lg:text-[1.7rem]">{title}</h2>
      {action ? <span className="text-sm font-medium text-cinema-cyan">{action}</span> : null}
    </div>
  );
}
