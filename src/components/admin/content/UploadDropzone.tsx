import { UploadCloud } from "lucide-react";

export function UploadDropzone({ name, label, accept }: { name: string; label: string; accept: string }) {
  return (
    <label className="group grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-white/18 bg-white/5 text-center text-sm text-cinema-muted transition hover:border-cinema-cyan/50 hover:bg-cinema-cyan/5 hover:text-white">
      <span>
        <UploadCloud className="mx-auto mb-3 text-cinema-cyan transition group-hover:scale-110" size={24} />
        {label}
        <span className="mt-1 block text-xs text-white/35">drag & drop futuro</span>
      </span>
      <input accept={accept} className="sr-only" name={name} type="file" />
    </label>
  );
}
