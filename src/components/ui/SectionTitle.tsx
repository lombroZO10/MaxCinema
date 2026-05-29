export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>
      {action ? <span className="text-sm font-medium text-cinema-cyan">{action}</span> : null}
    </div>
  );
}
