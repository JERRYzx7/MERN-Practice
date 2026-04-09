import type { Member } from "@/lib/api";

interface MemberAvatarPickerProps {
  members: Member[];
  selected: string[];
  onToggle: (userId: string) => void;
  label?: string;
}

export function MemberAvatarPicker({
  members,
  selected,
  onToggle,
  label = "選擇成員",
}: MemberAvatarPickerProps) {
  return (
    <div>
      {label && (
        <p className="font-pixel text-[9px] text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {members.map((m) => {
          const isSelected = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={isSelected}
              aria-label={m.name}
              className={[
                "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200",
                "border focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-teal cursor-pointer",
                isSelected
                  ? "border-neon-teal/40 bg-neon-teal/10 shadow-glow-teal"
                  : "border-white/5 bg-white/[0.03] hover:border-neon-teal/20 hover:bg-white/5",
              ].join(" ")}
            >
              {/* Avatar */}
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-all duration-200",
                  isSelected ? "ring-2 ring-neon-teal ring-offset-2 ring-offset-brand-bg" : "",
                ].join(" ")}
                style={{ background: stringToColor(m.id) }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-semibold">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Name */}
              <span
                className={[
                  "text-[10px] font-medium max-w-[48px] truncate",
                  isSelected ? "text-neon-teal" : "text-slate-500",
                ].join(" ")}
              >
                {m.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Deterministic color from userId string */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 35%)`;
}
