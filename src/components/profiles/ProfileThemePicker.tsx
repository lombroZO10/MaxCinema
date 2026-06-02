import { profileThemeColors } from "@/services/profile/viewer-profile-service";

export function ProfileThemePicker({ defaultColor }: { defaultColor?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {profileThemeColors.map((color) => (
        <label className="cursor-pointer" key={color}>
          <input
            className="peer sr-only"
            defaultChecked={(defaultColor || profileThemeColors[0]) === color}
            name="themeColor"
            type="radio"
            value={color}
          />
          <span
            className="grid size-11 place-items-center rounded-full border border-white/12 ring-offset-2 ring-offset-[#070b10] transition peer-checked:ring-2 peer-checked:ring-cinema-cyan"
            style={{ backgroundColor: color }}
          >
            <span className="size-3 rounded-full bg-black/28" />
          </span>
        </label>
      ))}
    </div>
  );
}
