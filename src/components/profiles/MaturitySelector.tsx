const ratings = ["Livre", "10", "12", "14", "16", "18"];

export function MaturitySelector({ defaultValue = "18" }: { defaultValue?: string }) {
  return (
    <select
      className="mt-2 h-12 w-full rounded-md border border-white/12 bg-[#080d12] px-4 text-sm text-white outline-none focus:border-cinema-cyan/70"
      defaultValue={defaultValue}
      name="maturityLimit"
    >
      {ratings.map((rating) => (
        <option key={rating} value={rating}>
          Ate {rating}
        </option>
      ))}
    </select>
  );
}
